const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');
const userRepository = require('../repositories/user.repository');
const refreshTokenRepository = require('../repositories/refreshToken.repository');
const loginAttemptService = require('./loginAttempt.service');
const {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
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

  async register({ name, email, password }) {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // SECURITY: Always force role to 'employee' regardless of input
    // Admin/Manager roles must be assigned by existing admin via user management
    const user = await userRepository.create({
      name,
      email,
      password,
      role: 'employee'
    });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken();

    await refreshTokenRepository.create({
      user: user._id,
      token: refreshToken,
      expiresAt: this.getRefreshTokenExpiry(),
    });

    // SECURITY: Remove sensitive data from response
    const safeUser = user.toJSON();
    delete safeUser.password;

    return { user: safeUser, accessToken, refreshToken };
  }

  async login({ email, password, ipAddress }) {
    // SECURITY: Check if account is locked due to failed attempts
    const { isLocked, remainingMs } = await loginAttemptService.checkLockout(email, ipAddress);
    if (isLocked) {
      const remainingMin = Math.ceil(remainingMs / 60000);
      throw new ForbiddenError(`Account temporarily locked. Try again in ${remainingMin} minutes.`);
    }

    const user = await userRepository.findByEmail(email, true);
    if (!user) {
      // Record failed attempt even for non-existent user (prevents enumeration)
      await loginAttemptService.recordFailedAttempt(email, ipAddress);
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new ForbiddenError('Account deactivated');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // SECURITY: Record failed login attempt
      const { shouldLock, attempts } = await loginAttemptService.recordFailedAttempt(email, ipAddress);
      if (shouldLock) {
        throw new ForbiddenError('Account temporarily locked due to too many failed attempts. Try again in 15 minutes.');
      }
      const remaining = await loginAttemptService.getRemainingAttempts(email, ipAddress);
      throw new UnauthorizedError(`Invalid email or password. ${remaining} attempts remaining.`);
    }

    // SECURITY: Reset failed attempts on successful login
    await loginAttemptService.resetAttempts(email, ipAddress);

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
    userWithPassword.passwordChangedAt = new Date();
    await userWithPassword.save();
  }
}

module.exports = new AuthService();
