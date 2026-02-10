const notificationRepository = require('../repositories/notification.repository');
const { enqueue } = require('./jobQueue');
const { processNotificationJob } = require('./notificationWorker');

class NotificationService {
  /**
   * Create a notification record and enqueue the send job.
   * @param {object} opts
   * @param {string} opts.userId - recipient user ObjectId
   * @param {string} opts.type - event type (e.g. 'travel.submitted')
   * @param {string} opts.title - notification title
   * @param {string} opts.message - notification body
   * @param {string} [opts.channel='email'] - delivery channel
   */
  async createAndEnqueue({ userId, type, title, message, channel = 'email' }) {
    const notification = await notificationRepository.create({
      userId,
      type,
      title,
      message,
      channel,
      status: 'pending',
      attempts: 0,
    });

    // Enqueue background processing
    enqueue(processNotificationJob, { notificationId: notification._id }, {
      maxRetries: 3,
      baseBackoffMs: 1000,
    });

    return notification;
  }

  /**
   * List notifications for a user (paginated).
   */
  async listMy({ userId, pagination }) {
    return notificationRepository.findByUser(userId, pagination);
  }
}

module.exports = new NotificationService();
