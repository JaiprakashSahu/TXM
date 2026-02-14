const Joi = require('joi');
const { ROLES } = require('../models/user.model');

const createUserSchema = Joi.object({
    name: Joi.string().required().trim().max(100),
    email: Joi.string().email().required().trim(),
    role: Joi.string()
        .valid(...ROLES)
        .required()
        .messages({
            'any.only': 'Role must be one of [employee, manager, admin]',
        }),
});

module.exports = {
    createUserSchema,
};
