const { User } = require('../models/user.model');

class UserRepository {
  async create(userData) {
    return User.create(userData);
  }

  async findByEmail(email, includePassword = false) {
    const query = User.findOne({ email });
    if (includePassword) {
      query.select('+password');
    }
    return query.exec();
  }

  async findById(id, includePassword = false) {
    const query = User.findById(id);
    if (includePassword) {
      query.select('+password');
    }
    return query.exec();
  }

  async findActiveById(id) {
    return User.findOne({ _id: id, isActive: true }).exec();
  }

  async findManagers() {
    return User.find({ role: { $in: ['manager', 'admin'] }, isActive: true })
      .select('_id name email role')
      .exec();
  }

  async findAll() {
    return User.find({}).sort({ createdAt: -1 }).exec();
  }
}

module.exports = new UserRepository();
