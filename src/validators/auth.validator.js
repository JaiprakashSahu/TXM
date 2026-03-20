const Joi = require('joi');

// SECURITY: Password must contain uppercase, lowercase, number, and special character
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/;

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name must not exceed 100 characters',
    'any.required': 'Name is required',
  }),
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.email': 'Must be a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(PASSWORD_PATTERN)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must include uppercase, lowercase, number, and special character',
      'any.required': 'Password is required',
    }),
  // SECURITY: Role removed from registration - always defaults to 'employee'
  // Admin/Manager roles must be assigned by existing admin via user management
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.email': 'Must be a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required',
  }),
});

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required().messages({
    'any.required': 'Old password is required',
  }),
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(PASSWORD_PATTERN)
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters',
      'string.max': 'New password must not exceed 128 characters',
      'string.pattern.base': 'Password must include uppercase, lowercase, number, and special character',
      'any.required': 'New password is required',
    }),
}).custom((value, helpers) => {
  // SECURITY: Prevent reusing the same password
  if (value.oldPassword === value.newPassword) {
    return helpers.error('any.invalid', { message: 'New password must be different from old password' });
  }
  return value;
});

module.exports = { registerSchema, loginSchema, refreshSchema, changePasswordSchema };
