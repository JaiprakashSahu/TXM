const bookingRepository = require('../repositories/booking.repository');
const travelRequestRepository = require('../repositories/travelRequest.repository');
const inventory = require('./inventoryProvider');
const { eventBus, EVENTS } = require('../events/eventBus');
const logger = require('../utils/logger');
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} = require('../utils/errors');

// ── Provider simulator ───────────────────────────────────────────────────────

/**
 * Simulates a third-party booking provider call.
 * - 20% random failure rate
 * - Random delay 200–800ms
 */
function simulateProviderBooking() {
  return new Promise((resolve, reject) => {
    const delay = 200 + Math.floor(Math.random() * 600);
    setTimeout(() => {
      const shouldFail = Math.random() < 0.2;
      if (shouldFail) {
        reject(new Error('Provider error: booking service temporarily unavailable'));
      } else {
        resolve({ providerConfirmation: `CONF-${Date.now()}` });
      }
    }, delay);
  });
}

// ── Service ──────────────────────────────────────────────────────────────────

class BookingService {
  /**
   * Create a booking with idempotency support, inventory locking, and compensation.
   */
  async create({ data, idempotencyKey, actor }) {
    if (!idempotencyKey) {
      throw new BadRequestError('Idempotency-Key header is required');
    }

    // ── 1. Idempotency check: return existing booking if key exists ──────
    const existing = await bookingRepository.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      logger.info(`Idempotency hit: key=${idempotencyKey}, booking=${existing._id}`);
      return bookingRepository.findById(existing._id);
    }

    // ── 2. Validate travel request ───────────────────────────────────────
    const tr = await travelRequestRepository.findByIdRaw(data.travelRequestId);
    if (!tr) {
      throw new NotFoundError('Travel request not found');
    }

    if (tr.userId.toString() !== actor._id.toString()) {
      throw new ForbiddenError('You can only book for your own travel requests');
    }

    if (tr.status !== 'manager_approved') {
      throw new BadRequestError(
        `Travel request must be in 'manager_approved' status to book. Current: '${tr.status}'`
      );
    }

    // ── 3. Validate inventory item exists and matches type ───────────────
    const item = inventory.findItem(data.inventoryId);
    if (!item) {
      throw new NotFoundError(`Inventory item '${data.inventoryId}' not found`);
    }

    const isFlightItem = 'availableSeats' in item;
    const expectedType = isFlightItem ? 'flight' : 'hotel';
    if (data.type !== expectedType) {
      throw new BadRequestError(
        `Inventory item '${data.inventoryId}' is a ${expectedType}, not a ${data.type}`
      );
    }

    const price = isFlightItem ? item.price : item.pricePerNight;
    const currency = item.currency || 'INR';

    // ── 4. Lock inventory ────────────────────────────────────────────────
    const lockResult = inventory.lockItem(data.inventoryId);
    if (!lockResult.success) {
      throw new ConflictError(lockResult.error);
    }

    // ── 5. Create booking record as initiated ────────────────────────────
    let booking;
    try {
      booking = await bookingRepository.create({
        travelRequestId: data.travelRequestId,
        userId: actor._id,
        type: data.type,
        inventoryId: data.inventoryId,
        price,
        currency,
        status: 'initiated',
        idempotencyKey,
        attempts: 1,
      });
    } catch (err) {
      // Duplicate key on idempotencyKey — race condition, another request won
      if (err.code === 11000) {
        inventory.releaseItem(data.inventoryId);
        const raceWinner = await bookingRepository.findByIdempotencyKey(idempotencyKey);
        if (raceWinner) {
          return bookingRepository.findById(raceWinner._id);
        }
      }
      inventory.releaseItem(data.inventoryId);
      throw err;
    }

    // ── 6. Simulate provider booking call ────────────────────────────────
    try {
      await simulateProviderBooking();

      // Success → confirm booking
      booking.status = 'confirmed';
      booking.confirmedAt = new Date();
      await bookingRepository.save(booking);

      // Transition travel request → booked
      tr.status = 'booked';
      tr.auditLogs.push({
        action: 'booked',
        actorId: actor._id,
        actorRole: actor.role,
        note: `Booking confirmed: ${booking._id} (${data.type} — ${data.inventoryId})`,
      });
      await travelRequestRepository.save(tr);

      logger.info(`Booking confirmed: ${booking._id}`);

      // Emit domain event — fire-and-forget
      eventBus.emitEvent(EVENTS.BOOKING_CONFIRMED, { booking, actor });
    } catch (providerErr) {
      // Failure → compensate
      booking.status = 'failed';
      booking.lastError = providerErr.message;
      booking.attempts += 1;
      await bookingRepository.save(booking);

      // Restore inventory
      inventory.releaseItem(data.inventoryId);

      logger.warn(`Booking failed: ${booking._id} — ${providerErr.message}`);

      // Emit domain event — fire-and-forget
      eventBus.emitEvent(EVENTS.BOOKING_FAILED, {
        booking,
        actor,
        error: providerErr.message,
      });
    }

    return bookingRepository.findById(booking._id);
  }

  /**
   * Retry a failed booking with the same idempotency key.
   * Client sends POST /booking with the same key and data — if the previous
   * attempt failed, we delete the failed record and retry fresh.
   * If it succeeded, we return the existing confirmed booking (idempotency).
   */

  /**
   * Cancel a confirmed booking.
   */
  async cancel({ id, actor }) {
    const booking = await bookingRepository.findByIdRaw(id);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.userId.toString() !== actor._id.toString()) {
      throw new ForbiddenError('You can only cancel your own bookings');
    }

    if (booking.status !== 'confirmed') {
      throw new BadRequestError(
        `Only confirmed bookings can be cancelled. Current: '${booking.status}'`
      );
    }

    // Restore inventory
    inventory.releaseItem(booking.inventoryId);

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await bookingRepository.save(booking);

    // Transition travel request → cancelled
    const tr = await travelRequestRepository.findByIdRaw(booking.travelRequestId);
    if (tr && tr.status === 'booked') {
      tr.status = 'cancelled';
      tr.auditLogs.push({
        action: 'cancelled',
        actorId: actor._id,
        actorRole: actor.role,
        note: `Booking cancelled: ${booking._id}`,
      });
      await travelRequestRepository.save(tr);
    }

    logger.info(`Booking cancelled: ${booking._id}`);
    return bookingRepository.findById(booking._id);
  }

  /**
   * List bookings for the authenticated user.
   */
  async listMy({ userId, pagination }) {
    return bookingRepository.findByUser(userId, pagination);
  }

  /**
   * Get a single booking by ID.
   */
  async getById({ id, actor }) {
    const booking = await bookingRepository.findById(id);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    const isOwner = booking.userId._id.toString() === actor._id.toString();
    const isAdmin = actor.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenError('Not authorized to view this booking');
    }

    return booking;
  }

  /**
   * Get available flight options.
   */
  getFlightOptions() {
    return inventory.getFlights();
  }

  /**
   * Get available hotel options.
   */
  getHotelOptions() {
    return inventory.getHotels();
  }
}

module.exports = new BookingService();
