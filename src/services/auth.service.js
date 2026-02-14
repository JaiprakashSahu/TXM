const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');
const userRepository = require('../repositories/user.repository');
const refreshTokenRepository = require('../repositories/refreshToken.repository');
const {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} = require('../utils/errors');

class AuthService {
  generateAccessToken(user) {
    return jwt.sign(
      { sub: user._id, email: user.email, role: user.role },
      env.jwt.accessSecret,
      { expiresIn: env.jwt.accessExpiry }
    );
  }

  generateRefreshToken() {
    return crypto.randomBytes(40).toString('hex');
  }

  getRefreshTokenExpiry() {
    const match = env.jwt.refreshExpiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // default 7 days
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return new Date(Date.now() + value * multipliers[unit]);
  }

  async register({ name, email, password, role }) {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const user = await userRepository.create({ name, email, password, role });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken();

    await refreshTokenRepository.create({
      user: user._id,
      token: refreshToken,
      expiresAt: this.getRefreshTokenExpiry(),
    });

    return { user, accessToken, refreshToken };
  }

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email, true);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken();

    await refreshTokenRepository.create({
      user: user._id,
      token: refreshToken,
      expiresAt: this.getRefreshTokenExpiry(),
    });

    // Remove password from response
    user.password = undefined;

    return {
      user: {
        ...user.toJSON(),
        mustChangePassword: user.mustChangePassword
      },
      accessToken,
      refreshToken
    };
  }

  async refresh(refreshToken) {
    const storedToken = await refreshTokenRepository.findByToken(refreshToken);
    if (!storedToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (storedToken.expiresAt < new Date()) {
      await refreshTokenRepository.deleteByToken(refreshToken);
      throw new UnauthorizedError('Refresh token expired');
    }

    const user = await userRepository.findActiveById(storedToken.user);
    if (!user) {
      await refreshTokenRepository.deleteByToken(refreshToken);
      throw new NotFoundError('User not found or inactive');
    }

    // Rotate refresh token
    await refreshTokenRepository.deleteByToken(refreshToken);

    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken();

    await refreshTokenRepository.create({
      user: user._id,
      token: newRefreshToken,
      expiresAt: this.getRefreshTokenExpiry(),
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken) {
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token is required');
    }
    await refreshTokenRepository.deleteByToken(refreshToken);
  }

  async changePassword(userId, oldPassword, newPassword) {
    const user = await userRepository.findActiveById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // We need to fetch password explicitly because select: false in schema
    const userWithPassword = await userRepository.findById(userId, true);

    const isMatch = await userWithPassword.comparePassword(oldPassword);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid password');
    }

    userWithPassword.password = newPassword;
    userWithPassword.mustChangePassword = false;
    await userWithPassword.save();
  }
}

module.exports = new AuthService();
