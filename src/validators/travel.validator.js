const Joi = require('joi');

const objectId = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .message('Must be a valid ObjectId');

const createTravelSchema = Joi.object({
  managerId: objectId.required().messages({
    'any.required': 'Manager ID is required',
  }),
  destination: Joi.string().trim().min(2).max(200).required().messages({
    'string.min': 'Destination must be at least 2 characters',
    'string.max': 'Destination must not exceed 200 characters',
    'any.required': 'Destination is required',
  }),
  startDate: Joi.date().iso().greater('now').required().messages({
    'date.greater': 'Start date must be in the future',
    'any.required': 'Start date is required',
  }),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).required().messages({
    'date.greater': 'End date must be after start date',
    'any.required': 'End date is required',
  }),
  estimatedCost: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Estimated cost must be greater than 0',
    'any.required': 'Estimated cost is required',
  }),
  purpose: Joi.string().trim().min(5).max(1000).required().messages({
    'string.min': 'Purpose must be at least 5 characters',
    'string.max': 'Purpose must not exceed 1000 characters',
    'any.required': 'Purpose is required',
  }),
});

const updateTravelSchema = Joi.object({
  managerId: objectId.messages({
    'string.pattern.base': 'Must be a valid ObjectId',
  }),
  destination: Joi.string().trim().min(2).max(200).messages({
    'string.min': 'Destination must be at least 2 characters',
    'string.max': 'Destination must not exceed 200 characters',
  }),
  startDate: Joi.date().iso().greater('now').messages({
    'date.greater': 'Start date must be in the future',
  }),
  endDate: Joi.date().iso().messages({}),
  estimatedCost: Joi.number().positive().precision(2).messages({
    'number.positive': 'Estimated cost must be greater than 0',
  }),
  purpose: Joi.string().trim().min(5).max(1000).messages({
    'string.min': 'Purpose must be at least 5 characters',
    'string.max': 'Purpose must not exceed 1000 characters',
  }),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided for update' })
  .custom((value, helpers) => {
    // Cross-field: if both dates present, endDate must be after startDate
    if (value.startDate && value.endDate && value.endDate <= value.startDate) {
      return helpers.error('any.invalid', {
        message: 'End date must be after start date',
      });
    }
    return value;
  });

const submitTravelSchema = Joi.object({
  note: Joi.string().trim().max(500).allow('').default('').messages({
    'string.max': 'Note must not exceed 500 characters',
  }),
});

const managerActionSchema = Joi.object({
  comment: Joi.string().trim().max(1000).allow('').default('').messages({
    'string.max': 'Comment must not exceed 1000 characters',
  }),
});

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  createTravelSchema,
  updateTravelSchema,
  submitTravelSchema,
  managerActionSchema,
  paginationSchema,
};
