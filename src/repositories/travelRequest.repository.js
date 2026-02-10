const { TravelRequest } = require('../models/travelRequest.model');

class TravelRequestRepository {
  async create(data) {
    return TravelRequest.create(data);
  }

  async findById(id) {
    return TravelRequest.findById(id)
      .populate('userId', 'name email role')
      .populate('managerId', 'name email role')
      .exec();
  }

  async findByIdRaw(id) {
    return TravelRequest.findById(id).exec();
  }

  async save(doc) {
    return doc.save();
  }

  async findByUser(userId, { page, limit }) {
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      TravelRequest.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('managerId', 'name email')
        .exec(),
      TravelRequest.countDocuments({ userId }),
    ]);

    return { docs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findPendingForManager(managerId, { page, limit }) {
    const skip = (page - 1) * limit;
    const filter = { managerId, status: 'submitted' };

    const [docs, total] = await Promise.all([
      TravelRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email role')
        .exec(),
      TravelRequest.countDocuments(filter),
    ]);

    return { docs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

module.exports = new TravelRequestRepository();
