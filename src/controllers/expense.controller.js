const expenseService = require('../services/expense.service');
const {
  createExpenseSchema,
  financeDecisionSchema,
  expensePaginationSchema,
} = require('../validators/expense.validator');
const { BadRequestError } = require('../utils/errors');

function validate(schema, data) {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    throw new BadRequestError(error.details.map((d) => d.message).join(', '));
  }
  return value;
}

class ExpenseController {
  async submit(req, res) {
    const data = validate(createExpenseSchema, req.body);

    // Build receipt path from multer upload (if present)
    const receiptPath = req.file
      ? `/uploads/receipts/${req.file.filename}`
      : '';

    const result = await expenseService.submit({
      data,
      receiptPath,
      actor: req.user,
    });

    res.status(201).json({
      success: true,
      message:
        result.status === 'flagged'
          ? 'Expense submitted and flagged for review'
          : 'Expense submitted',
      data: result,
    });
  }

  async approve(req, res) {
    const { comment } = validate(financeDecisionSchema, req.body);
    const result = await expenseService.approve({
      id: req.params.id,
      actor: req.user,
      comment,
    });

    res.status(200).json({
      success: true,
      message: 'Expense approved',
      data: result,
    });
  }

  async reject(req, res) {
    const { comment } = validate(financeDecisionSchema, req.body);
    const result = await expenseService.reject({
      id: req.params.id,
      actor: req.user,
      comment,
    });

    res.status(200).json({
      success: true,
      message: 'Expense rejected',
      data: result,
    });
  }

  async listMy(req, res) {
    const filters = validate(expensePaginationSchema, req.query);
    const result = await expenseService.listMy({
      userId: req.user._id,
      filters,
    });

    res.status(200).json({
      success: true,
      data: result.docs,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  }

  async listPending(req, res) {
    const pagination = validate(expensePaginationSchema, req.query);
    const result = await expenseService.listPending({ pagination });

    res.status(200).json({
      success: true,
      data: result.docs,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  }

  async getById(req, res) {
    const result = await expenseService.getById({
      id: req.params.id,
      actor: req.user,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  }
}

module.exports = new ExpenseController();
