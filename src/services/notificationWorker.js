const notificationRepository = require('../repositories/notification.repository');
const { sendEmail } = require('./emailProvider');
const logger = require('../utils/logger');

/**
 * Process a single notification job.
 *
 * - Loads the notification from DB
 * - Simulates 10% random failure for email channel
 * - On success: status → sent, records sentAt
 * - On failure: increments attempts, records lastError, status → failed if exhausted
 *
 * Designed to be called by the job queue — the queue handles retries at the
 * infrastructure level, but we also track attempts in the DB for audit.
 */

const MAX_ATTEMPTS = 3;

async function processNotificationJob({ notificationId }) {
  const notification = await notificationRepository.findById(notificationId);

  if (!notification) {
    logger.warn(`[Worker] Notification ${notificationId} not found — skipping`);
    return;
  }

  if (notification.status === 'sent') {
    logger.info(`[Worker] Notification ${notificationId} already sent — skipping`);
    return;
  }

  notification.attempts += 1;

  try {
    if (notification.channel === 'email') {
      // 10% random failure simulation
      if (Math.random() < 0.1) {
        throw new Error('Simulated email delivery failure');
      }

      // Resolve user email for sending
      await notification.populate('userId', 'name email');
      const userEmail = notification.userId?.email || 'unknown@example.com';

      await sendEmail(userEmail, notification.title, notification.message);
    }

    // In-app notifications are "sent" the moment they're persisted
    notification.status = 'sent';
    notification.sentAt = new Date();
    notification.lastError = '';

    await notificationRepository.save(notification);
    logger.info(`[Worker] Notification ${notificationId} sent successfully`);
  } catch (err) {
    notification.lastError = err.message;

    if (notification.attempts >= MAX_ATTEMPTS) {
      notification.status = 'failed';
      logger.error(
        `[Worker] Notification ${notificationId} failed permanently after ${MAX_ATTEMPTS} attempts: ${err.message}`
      );
    }

    await notificationRepository.save(notification);

    // Re-throw so the queue's retry logic can handle backoff
    throw err;
  }
}

module.exports = { processNotificationJob };
