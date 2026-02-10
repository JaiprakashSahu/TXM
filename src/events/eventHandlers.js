const { eventBus, EVENTS } = require('./eventBus');
const notificationService = require('../services/notification.service');
const userRepository = require('../repositories/user.repository');
const { User } = require('../models/user.model');
const logger = require('../utils/logger');

/**
 * Register all domain event handlers.
 * Called once at application startup.
 *
 * Each handler:
 * 1. Determines the notification recipient
 * 2. Builds title + message
 * 3. Delegates to notificationService.createAndEnqueue()
 *
 * Handlers are async but fire-and-forget — errors are logged, never thrown back.
 */
function registerHandlers() {
  // ── travel.submitted → notify the assigned manager ────────────────────
  eventBus.on(EVENTS.TRAVEL_SUBMITTED, async (payload) => {
    try {
      const { travelRequest, actor } = payload;

      await notificationService.createAndEnqueue({
        userId: travelRequest.managerId,
        type: EVENTS.TRAVEL_SUBMITTED,
        title: 'New travel request awaiting your approval',
        message: `${actor.name} submitted a travel request to ${travelRequest.destination} `
          + `(${new Date(travelRequest.startDate).toLocaleDateString()} – `
          + `${new Date(travelRequest.endDate).toLocaleDateString()}). `
          + `Estimated cost: ₹${travelRequest.estimatedCost}.`,
        channel: 'email',
      });
    } catch (err) {
      logger.error(`[EventHandler] travel.submitted handler failed: ${err.message}`);
    }
  });

  // ── travel.approved → notify the employee ─────────────────────────────
  eventBus.on(EVENTS.TRAVEL_APPROVED, async (payload) => {
    try {
      const { travelRequest, actor } = payload;

      await notificationService.createAndEnqueue({
        userId: travelRequest.userId,
        type: EVENTS.TRAVEL_APPROVED,
        title: 'Your travel request has been approved',
        message: `Your travel request to ${travelRequest.destination} has been approved`
          + (travelRequest.managerComment
            ? `. Manager comment: "${travelRequest.managerComment}"`
            : '.'),
        channel: 'email',
      });
    } catch (err) {
      logger.error(`[EventHandler] travel.approved handler failed: ${err.message}`);
    }
  });

  // ── travel.rejected → notify the employee ─────────────────────────────
  eventBus.on(EVENTS.TRAVEL_REJECTED, async (payload) => {
    try {
      const { travelRequest, actor } = payload;

      await notificationService.createAndEnqueue({
        userId: travelRequest.userId,
        type: EVENTS.TRAVEL_REJECTED,
        title: 'Your travel request has been rejected',
        message: `Your travel request to ${travelRequest.destination} has been rejected`
          + (travelRequest.managerComment
            ? `. Reason: "${travelRequest.managerComment}"`
            : '.'),
        channel: 'email',
      });
    } catch (err) {
      logger.error(`[EventHandler] travel.rejected handler failed: ${err.message}`);
    }
  });

  // ── expense.flagged → notify all admins (finance team) ────────────────
  eventBus.on(EVENTS.EXPENSE_FLAGGED, async (payload) => {
    try {
      const { expense, actor } = payload;

      // Find all admin users to notify
      const admins = await User.find({ role: 'admin', isActive: true })
        .select('_id')
        .lean()
        .exec();

      for (const admin of admins) {
        await notificationService.createAndEnqueue({
          userId: admin._id,
          type: EVENTS.EXPENSE_FLAGGED,
          title: 'Expense flagged for review',
          message: `An expense of ₹${expense.amount} (${expense.category}) submitted by `
            + `user ${actor.name} has been auto-flagged. `
            + `Reason: ${expense.flaggedReason || 'Policy violation detected'}.`,
          channel: 'email',
        });
      }
    } catch (err) {
      logger.error(`[EventHandler] expense.flagged handler failed: ${err.message}`);
    }
  });

  // ── expense.approved → notify the employee ────────────────────────────
  eventBus.on(EVENTS.EXPENSE_APPROVED, async (payload) => {
    try {
      const { expense } = payload;

      await notificationService.createAndEnqueue({
        userId: expense.userId,
        type: EVENTS.EXPENSE_APPROVED,
        title: 'Your expense has been approved',
        message: `Your expense of ₹${expense.amount} (${expense.category}) has been approved by finance.`,
        channel: 'email',
      });
    } catch (err) {
      logger.error(`[EventHandler] expense.approved handler failed: ${err.message}`);
    }
  });

  // ── booking.confirmed → notify the employee ──────────────────────────
  eventBus.on(EVENTS.BOOKING_CONFIRMED, async (payload) => {
    try {
      const { booking, actor } = payload;

      await notificationService.createAndEnqueue({
        userId: booking.userId,
        type: EVENTS.BOOKING_CONFIRMED,
        title: 'Your booking has been confirmed',
        message: `Your ${booking.type} booking (${booking.inventoryId}) has been confirmed. `
          + `Price: ₹${booking.price} ${booking.currency}.`,
        channel: 'email',
      });
    } catch (err) {
      logger.error(`[EventHandler] booking.confirmed handler failed: ${err.message}`);
    }
  });

  // ── booking.failed → notify the employee ──────────────────────────────
  eventBus.on(EVENTS.BOOKING_FAILED, async (payload) => {
    try {
      const { booking, actor, error } = payload;

      await notificationService.createAndEnqueue({
        userId: booking.userId,
        type: EVENTS.BOOKING_FAILED,
        title: 'Your booking attempt failed',
        message: `Your ${booking.type} booking (${booking.inventoryId}) could not be confirmed. `
          + `Error: ${error || booking.lastError || 'Provider unavailable'}. `
          + `You may retry.`,
        channel: 'email',
      });
    } catch (err) {
      logger.error(`[EventHandler] booking.failed handler failed: ${err.message}`);
    }
  });

  logger.info('[EventHandler] All domain event handlers registered');
}

module.exports = { registerHandlers };
