const { Expense } = require('../models/expense.model');

class ExpenseRepository {
  async create(data) {
    return Expense.create(data);
  }

  async findById(id) {
    return Expense.findById(id)
      .populate('userId', 'name email role')
      .populate('travelRequestId', 'destination startDate endDate status')
      .exec();
  }

  async findByIdRaw(id) {
    return Expense.findById(id).exec();
  }

  async save(doc) {
    return doc.save();
  }

  /**
   * Duplicate detection: check if same user + same amount + same date already exists.
   */
  async findDuplicate({ userId, amount, expenseDate }) {
    const startOfDay = new Date(expenseDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(expenseDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return Expense.findOne({
      userId,
      amount,
      expenseDate: { $gte: startOfDay, $lte: endOfDay },
    }).exec();
  }

  async findByUser(userId, { page, limit, category, status, travelRequestId }) {
    const skip = (page - 1) * limit;
    const filter = { userId };

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (travelRequestId) filter.travelRequestId = travelRequestId;

    const [docs, total] = await Promise.all([
      Expense.find(filter)
        .sort({ expenseDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate('travelRequestId', 'destination startDate endDate status')
        .exec(),
      Expense.countDocuments(filter),
    ]);

    return { docs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findPendingForFinance({ page, limit }) {
    const skip = (page - 1) * limit;
    const filter = { status: { $in: ['submitted', 'flagged'] } };

    const [docs, total] = await Promise.all([
      Expense.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email role')
        .populate('travelRequestId', 'destination startDate endDate status')
        .exec(),
      Expense.countDocuments(filter),
    ]);

    return { docs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findFlagged({ page, limit }) {
    const skip = (page - 1) * limit;
    const filter = { status: 'flagged' };

    const [docs, total] = await Promise.all([
      Expense.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email role')
        .populate('travelRequestId', 'destination startDate endDate status')
        .exec(),
      Expense.countDocuments(filter),
    ]);

    return { docs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

module.exports = new ExpenseRepository();
