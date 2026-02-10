const mongoose = require('mongoose');

const NOTIFICATION_CHANNELS = ['email', 'inapp'];
const NOTIFICATION_STATUSES = ['pending', 'sent', 'failed'];

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    channel: {
      type: String,
      enum: NOTIFICATION_CHANNELS,
      required: true,
    },
    status: {
      type: String,
      enum: NOTIFICATION_STATUSES,
      default: 'pending',
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastError: {
      type: String,
      default: '',
    },
    sentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = { Notification, NOTIFICATION_CHANNELS, NOTIFICATION_STATUSES };
