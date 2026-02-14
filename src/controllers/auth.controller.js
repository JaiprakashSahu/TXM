const authService = require('../services/auth.service');
const userRepository = require('../repositories/user.repository');
const { registerSchema, loginSchema, refreshSchema, changePasswordSchema } = require('../validators/auth.validator');
const { BadRequestError } = require('../utils/errors');

class AuthController {
  async register(req, res) {
    const { error, value } = registerSchema.validate(req.body, { abortEarly: false });
    if (error) {
      throw new BadRequestError(error.details.map((d) => d.message).join(', '));
    }

    const { user, accessToken, refreshToken } = await authService.register(value);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user, accessToken, refreshToken },
    });
  }

  async login(req, res) {
    const { error, value } = loginSchema.validate(req.body, { abortEarly: false });
    if (error) {
      throw new BadRequestError(error.details.map((d) => d.message).join(', '));
    }

    const { user, accessToken, refreshToken } = await authService.login(value);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user, accessToken, refreshToken },
    });
  }

  async refresh(req, res) {
    const { error, value } = refreshSchema.validate(req.body, { abortEarly: false });
    if (error) {
      throw new BadRequestError(error.details.map((d) => d.message).join(', '));
    }

    const tokens = await authService.refresh(value.refreshToken);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: tokens,
    });
  }

  async logout(req, res) {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);

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
    res.status(200).json({
      success: true,
      data: req.user,
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
