const Joi = require('joi');
const { EXPENSE_CATEGORIES } = require('../models/expense.model');

const objectId = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .message('Must be a valid ObjectId');

const createExpenseSchema = Joi.object({
  travelRequestId: objectId.required().messages({
    'any.required': 'Travel request ID is required',
  }),
  amount: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Amount must be greater than 0',
    'any.required': 'Amount is required',
  }),
  category: Joi.string()
    .valid(...EXPENSE_CATEGORIES)
    .required()
    .messages({
      'any.only': `Category must be one of: ${EXPENSE_CATEGORIES.join(', ')}`,
      'any.required': 'Category is required',
    }),
  expenseDate: Joi.date().iso().max('now').required().messages({
    'date.max': 'Expense date cannot be in the future',
    'any.required': 'Expense date is required',
  }),
  description: Joi.string().trim().max(1000).allow('').default('').messages({
    'string.max': 'Description must not exceed 1000 characters',
  }),
});

const financeDecisionSchema = Joi.object({
  comment: Joi.string().trim().max(1000).allow('').default('').messages({
    'string.max': 'Comment must not exceed 1000 characters',
  }),
});

const expensePaginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  category: Joi.string()
    .valid(...EXPENSE_CATEGORIES)
    .optional(),
  status: Joi.string()
    .valid('submitted', 'finance_approved', 'finance_rejected', 'flagged')
    .optional(),
  travelRequestId: objectId.optional(),
});

module.exports = {
  createExpenseSchema,
  financeDecisionSchema,
  expensePaginationSchema,
};
