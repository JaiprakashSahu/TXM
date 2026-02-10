const mongoose = require('mongoose');

const TRAVEL_STATUSES = [
  'draft',
  'submitted',
  'manager_approved',
  'manager_rejected',
  'booked',
  'completed',
  'cancelled',
];

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

const travelRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    estimatedCost: {
      type: Number,
      required: true,
      min: 0,
    },
    purpose: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: TRAVEL_STATUSES,
      default: 'draft',
    },
    managerComment: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    policySnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
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
    hasViolations: {
      type: Boolean,
      default: false,
    },
    auditLogs: [auditLogSchema],
  },
  {
    timestamps: true,
  }
);

// Compound indexes for query performance
travelRequestSchema.index({ userId: 1, createdAt: -1 });
travelRequestSchema.index({ managerId: 1, status: 1 });

const TravelRequest = mongoose.model('TravelRequest', travelRequestSchema);

module.exports = { TravelRequest, TRAVEL_STATUSES };
