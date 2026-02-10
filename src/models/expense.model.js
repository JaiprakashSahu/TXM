const mongoose = require('mongoose');

const EXPENSE_STATUSES = ['submitted', 'finance_approved', 'finance_rejected', 'flagged'];

const EXPENSE_CATEGORIES = ['flight', 'hotel', 'food', 'transport', 'other'];

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actorRole: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const expenseSchema = new mongoose.Schema(
  {
    travelRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TravelRequest',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      enum: EXPENSE_CATEGORIES,
      required: true,
    },
    expenseDate: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    receiptUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: EXPENSE_STATUSES,
      default: 'submitted',
    },
    flaggedReason: {
      type: String,
      trim: true,
      default: '',
    },
    violations: {
      type: [
        {
          code: String,
          message: String,
          amount: mongoose.Schema.Types.Mixed,
          limit: mongoose.Schema.Types.Mixed,
        },
      ],
      default: [],
    },
    auditLogs: [auditLogSchema],
  },
  {
    timestamps: true,
  }
);

// Query performance indexes
expenseSchema.index({ travelRequestId: 1, expenseDate: -1 });
expenseSchema.index({ userId: 1, expenseDate: -1 });

// Duplicate detection helper index
expenseSchema.index({ userId: 1, amount: 1, expenseDate: 1 });

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = { Expense, EXPENSE_STATUSES, EXPENSE_CATEGORIES };
