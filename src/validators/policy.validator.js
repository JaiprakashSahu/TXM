const Joi = require('joi');

const policyRulesSchema = Joi.object({
  maxFlightCost: Joi.number().positive().required().messages({
    'number.positive': 'Max flight cost must be greater than 0',
    'any.required': 'Max flight cost is required',
  }),
  maxHotelPerDay: Joi.number().positive().required().messages({
    'number.positive': 'Max hotel per day must be greater than 0',
    'any.required': 'Max hotel per day is required',
  }),
  maxDailyFood: Joi.number().positive().required().messages({
    'number.positive': 'Max daily food must be greater than 0',
    'any.required': 'Max daily food is required',
  }),
  maxTripTotal: Joi.number().positive().required().messages({
    'number.positive': 'Max trip total must be greater than 0',
    'any.required': 'Max trip total is required',
  }),
  allowedFlightClasses: Joi.array()
    .items(Joi.string().trim().min(1))
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one flight class must be specified',
      'any.required': 'Allowed flight classes are required',
    }),
});

const createPolicySchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).required().messages({
    'string.min': 'Policy name must be at least 2 characters',
    'string.max': 'Policy name must not exceed 200 characters',
    'any.required': 'Policy name is required',
  }),
  rules: policyRulesSchema.required().messages({
    'any.required': 'Policy rules are required',
  }),
});

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  createPolicySchema,
  paginationSchema,
};
