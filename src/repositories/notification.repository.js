const { Notification } = require('../models/notification.model');

class NotificationRepository {
  async create(data) {
    return Notification.create(data);
  }

  async findById(id) {
    return Notification.findById(id).exec();
  }

  async save(doc) {
    return doc.save();
  }

  async findByUser(userId, { page, limit }) {
    const skip = (page - 1) * limit;
    const filter = { userId };

    const [docs, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Notification.countDocuments(filter),
    ]);

    return { docs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

module.exports = new NotificationRepository();
