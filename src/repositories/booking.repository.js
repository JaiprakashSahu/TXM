const { Booking } = require('../models/booking.model');

class BookingRepository {
  async create(data) {
    return Booking.create(data);
  }

  async findById(id) {
    return Booking.findById(id)
      .populate('userId', 'name email role')
      .populate('travelRequestId', 'destination startDate endDate status')
      .exec();
  }

  async findByIdRaw(id) {
    return Booking.findById(id).exec();
  }

  async save(doc) {
    return doc.save();
  }

  async findByIdempotencyKey(key) {
    return Booking.findOne({ idempotencyKey: key }).exec();
  }

  async findByUser(userId, { page, limit }) {
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      Booking.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('travelRequestId', 'destination startDate endDate status')
        .exec(),
      Booking.countDocuments({ userId }),
    ]);

    return { docs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByTravelRequest(travelRequestId) {
    return Booking.find({ travelRequestId })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email role')
      .exec();
  }
}

module.exports = new BookingRepository();
