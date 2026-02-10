const Joi = require('joi');

const objectId = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .message('Must be a valid ObjectId');

const createBookingSchema = Joi.object({
  travelRequestId: objectId.required().messages({
    'any.required': 'Travel request ID is required',
  }),
  type: Joi.string().valid('flight', 'hotel').required().messages({
    'any.only': 'Type must be flight or hotel',
    'any.required': 'Booking type is required',
  }),
  inventoryId: Joi.string().trim().min(1).required().messages({
    'string.min': 'Inventory ID must not be empty',
    'any.required': 'Inventory ID is required',
  }),
});

const bookingPaginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  createBookingSchema,
  bookingPaginationSchema,
};
