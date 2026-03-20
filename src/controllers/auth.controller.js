const authService = require('../services/auth.service');
const userRepository = require('../repositories/user.repository');
const { registerSchema, loginSchema, refreshSchema, changePasswordSchema } = require('../validators/auth.validator');
const { BadRequestError } = require('../utils/errors');
const env = require('../config/env');

// SECURITY: Cookie options for refresh token
const REFRESH_COOKIE_NAME = 'itilite_refresh_token';
const getCookieOptions = () => ({
  httpOnly: true,
  secure: env.nodeEnv === 'production', // HTTPS only in production
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth', // Only sent to auth endpoints
});

class AuthController {
  /**
   * Sets refresh token as HttpOnly cookie
   */
  _setRefreshCookie(res, refreshToken) {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, getCookieOptions());
  }

  /**
   * Clears refresh token cookie
   */
  _clearRefreshCookie(res) {
    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: env.nodeEnv === 'production',
      sameSite: 'strict',
      path: '/api/auth',
    });
  }

  /**
   * Gets refresh token from cookie or body (backward compatibility)
   */
  _getRefreshToken(req) {
    // Prefer cookie over body for security
    return req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
  }

  async register(req, res) {
    const { error, value } = registerSchema.validate(req.body, { abortEarly: false });
    if (error) {
      throw new BadRequestError(error.details.map((d) => d.message).join(', '));
    }

    const { user, accessToken, refreshToken } = await authService.register(value);

    // SECURITY: Set refresh token in HttpOnly cookie
    this._setRefreshCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user, accessToken },
    });
  }

  async login(req, res) {
    const { error, value } = loginSchema.validate(req.body, { abortEarly: false });
    if (error) {
      throw new BadRequestError(error.details.map((d) => d.message).join(', '));
    }

    // SECURITY: Pass IP address for failed login tracking
    const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
    const { user, accessToken, refreshToken } = await authService.login({
      ...value,
      ipAddress,
    });

    // SECURITY: Set refresh token in HttpOnly cookie
    this._setRefreshCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user, accessToken },
    });
  }

  async refresh(req, res) {
    // SECURITY: Get refresh token from cookie (preferred) or body (backward compat)
    const refreshToken = this._getRefreshToken(req);

    if (!refreshToken) {
      throw new BadRequestError('Refresh token is required');
    }

    const tokens = await authService.refresh(refreshToken);

    // Set new refresh token in cookie
    this._setRefreshCookie(res, tokens.refreshToken);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: { accessToken: tokens.accessToken },
    });
  }

  async logout(req, res) {
    // SECURITY: Get refresh token from cookie (preferred) or body
    const refreshToken = this._getRefreshToken(req);

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    // Clear the refresh token cookie
    this._clearRefreshCookie(res);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }

  async changePassword(req, res) {
    const { error, value } = changePasswordSchema.validate(req.body, { abortEarly: false });
    if (error) {
      throw new BadRequestError(error.details.map((d) => d.message).join(', '));
    }

    const { oldPassword, newPassword } = value;
    await authService.changePassword(req.user._id, oldPassword, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  }

  async profile(req, res) {
    const user = req.user;
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
        createdAt: user.createdAt,
        passwordChangedAt: user.passwordChangedAt,
      },
    });
  }

  async listManagers(req, res) {
    const managers = await userRepository.findManagers();
    res.status(200).json({
      success: true,
      data: managers,
    });
  }
}

module.exports = new AuthController();
