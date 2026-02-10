const mongoose = require('mongoose');

const BOOKING_STATUSES = ['initiated', 'confirmed', 'failed', 'cancelled'];
const BOOKING_TYPES = ['flight', 'hotel'];

const bookingSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: BOOKING_TYPES,
      required: true,
    },
    inventoryId: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      maxlength: 3,
    },
    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: 'initiated',
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
    },
    attempts: {
      type: Number,
      default: 1,
    },
    lastError: {
      type: String,
      default: '',
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = { Booking, BOOKING_STATUSES, BOOKING_TYPES };
