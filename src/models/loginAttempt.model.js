const mongoose = require('mongoose');

/**
 * Tracks failed login attempts for account lockout protection.
 * TTL index automatically cleans up old records.
 */
const loginAttemptSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },
  ipAddress: {
    type: String,
    required: true,
  },
  attempts: {
    type: Number,
    default: 1,
  },
  lastAttempt: {
    type: Date,
    default: Date.now,
  },
  lockedUntil: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // TTL: 24 hours
  },
});

// Compound index for efficient lookups
loginAttemptSchema.index({ email: 1, ipAddress: 1 });

const LoginAttempt = mongoose.model('LoginAttempt', loginAttemptSchema);

module.exports = { LoginAttempt };
