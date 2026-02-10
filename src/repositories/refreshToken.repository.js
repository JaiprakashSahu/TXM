const RefreshToken = require('../models/refreshToken.model');

class RefreshTokenRepository {
  async create({ user, token, expiresAt }) {
    return RefreshToken.create({ user, token, expiresAt });
  }

  async findByToken(token) {
    return RefreshToken.findOne({ token }).exec();
  }

  async deleteByToken(token) {
    return RefreshToken.deleteOne({ token }).exec();
  }

  async deleteAllForUser(userId) {
    return RefreshToken.deleteMany({ user: userId }).exec();
  }
}

module.exports = new RefreshTokenRepository();
