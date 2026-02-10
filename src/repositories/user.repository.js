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

  async findById(id) {
    return User.findById(id).exec();
  }

  async findActiveById(id) {
    return User.findOne({ _id: id, isActive: true }).exec();
  }
}

module.exports = new UserRepository();
