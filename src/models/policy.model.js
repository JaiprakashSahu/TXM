const mongoose = require('mongoose');

const policyRulesSchema = new mongoose.Schema(
  {
    maxFlightCost: {
      type: Number,
      required: true,
      min: 0,
    },
    maxHotelPerDay: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDailyFood: {
      type: Number,
      required: true,
      min: 0,
    },
    maxTripTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    allowedFlightClasses: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'At least one flight class must be specified',
      },
    },
  },
  { _id: false }
);

const policySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    version: {
      type: Number,
      required: true,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    rules: {
      type: policyRulesSchema,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    activatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

policySchema.index({ isActive: 1 });

const Policy = mongoose.model('Policy', policySchema);

module.exports = { Policy };
