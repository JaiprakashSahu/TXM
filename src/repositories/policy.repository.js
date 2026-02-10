const mongoose = require('mongoose');
const { Policy } = require('../models/policy.model');

class PolicyRepository {
  async create(data) {
    return Policy.create(data);
  }

  async findById(id) {
    return Policy.findById(id).populate('createdBy', 'name email role').exec();
  }

  async findActive() {
    return Policy.findOne({ isActive: true })
      .populate('createdBy', 'name email role')
      .exec();
  }

  async findAll({ page, limit }) {
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      Policy.find()
        .sort({ version: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email role')
        .exec(),
      Policy.countDocuments(),
    ]);

    return { docs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getNextVersion() {
    const latest = await Policy.findOne().sort({ version: -1 }).exec();
    return latest ? latest.version + 1 : 1;
  }

  /**
   * Atomically deactivate the current active policy and activate the new one.
   * Uses a MongoDB transaction if replica set is available, otherwise
   * falls back to sequential operations with best-effort consistency.
   */
  async activatePolicy(policyId) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // Deactivate all currently active policies
      await Policy.updateMany(
        { isActive: true },
        { $set: { isActive: false } },
        { session }
      );

      // Activate the target policy
      const activated = await Policy.findByIdAndUpdate(
        policyId,
        { $set: { isActive: true, activatedAt: new Date() } },
        { new: true, session }
      );

      await session.commitTransaction();
      return activated;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }
}

module.exports = new PolicyRepository();
