const EventEmitter = require('events');
const logger = require('../utils/logger');

// ── Domain event names ─────────────────────────────────────────────────────

const EVENTS = {
  TRAVEL_SUBMITTED: 'travel.submitted',
  TRAVEL_APPROVED: 'travel.approved',
  TRAVEL_REJECTED: 'travel.rejected',
  EXPENSE_FLAGGED: 'expense.flagged',
  EXPENSE_APPROVED: 'expense.approved',
  BOOKING_CONFIRMED: 'booking.confirmed',
  BOOKING_FAILED: 'booking.failed',
};

// ── Single process-wide event bus ──────────────────────────────────────────

class DomainEventBus extends EventEmitter {
  constructor() {
    super();
    // Raise limit — each event type will have one handler
    this.setMaxListeners(20);
  }

  /**
   * Emit a domain event with payload.
   * Handlers are invoked asynchronously — errors in handlers do NOT propagate
   * back to the emitter (fire-and-forget).
   */
  emitEvent(name, payload) {
    logger.info(`[EventBus] Emitting: ${name}`, {
      eventId: payload.eventId || undefined,
    });

    // Wrap in setImmediate so the emitter returns immediately
    setImmediate(() => {
      this.emit(name, payload);
    });
  }
}

const eventBus = new DomainEventBus();

module.exports = { eventBus, EVENTS };
