const { LoginAttempt } = require('../models/loginAttempt.model');
const logger = require('../utils/logger');

// Configuration
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

class LoginAttemptService {
  /**
   * Check if an account is currently locked out.
   * @returns {object} { isLocked: boolean, remainingMs: number | null }
   */
  async checkLockout(email, ipAddress) {
    const attempt = await LoginAttempt.findOne({
      email: email.toLowerCase(),
      ipAddress,
    });

    if (!attempt || !attempt.lockedUntil) {
      return { isLocked: false, remainingMs: null };
    }

    const now = new Date();
    if (attempt.lockedUntil > now) {
      const remainingMs = attempt.lockedUntil - now;
      logger.warn(`Account locked: ${email} from ${ipAddress} for ${Math.ceil(remainingMs / 1000)}s`);
      return { isLocked: true, remainingMs };
    }

    // Lock expired, reset attempts
    await this.resetAttempts(email, ipAddress);
    return { isLocked: false, remainingMs: null };
  }

  /**
   * Record a failed login attempt.
   * @returns {object} { shouldLock: boolean, attempts: number }
   */
  async recordFailedAttempt(email, ipAddress) {
    const normalizedEmail = email.toLowerCase();
    const now = new Date();

    let attempt = await LoginAttempt.findOne({
      email: normalizedEmail,
      ipAddress,
    });

    if (!attempt) {
      // First failed attempt
      attempt = await LoginAttempt.create({
        email: normalizedEmail,
        ipAddress,
        attempts: 1,
        lastAttempt: now,
      });
      logger.info(`First failed login attempt for ${normalizedEmail} from ${ipAddress}`);
      return { shouldLock: false, attempts: 1 };
    }

    // Check if last attempt was outside the window (reset if so)
    const timeSinceLastAttempt = now - attempt.lastAttempt;
    if (timeSinceLastAttempt > ATTEMPT_WINDOW_MS) {
      attempt.attempts = 1;
      attempt.lastAttempt = now;
      attempt.lockedUntil = null;
      await attempt.save();
      return { shouldLock: false, attempts: 1 };
    }

    // Increment attempts
    attempt.attempts += 1;
    attempt.lastAttempt = now;

    // Check if should lock
    if (attempt.attempts >= MAX_ATTEMPTS) {
      attempt.lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS);
      await attempt.save();
      logger.warn(`Account locked due to ${attempt.attempts} failed attempts: ${normalizedEmail} from ${ipAddress}`);
      return { shouldLock: true, attempts: attempt.attempts };
    }

    await attempt.save();
    logger.info(`Failed login attempt ${attempt.attempts}/${MAX_ATTEMPTS} for ${normalizedEmail} from ${ipAddress}`);
    return { shouldLock: false, attempts: attempt.attempts };
  }

  /**
   * Reset failed attempts after successful login.
   */
  async resetAttempts(email, ipAddress) {
    await LoginAttempt.deleteOne({
      email: email.toLowerCase(),
      ipAddress,
    });
  }

  /**
   * Get remaining attempts before lockout.
   */
  async getRemainingAttempts(email, ipAddress) {
    const attempt = await LoginAttempt.findOne({
      email: email.toLowerCase(),
      ipAddress,
    });

    if (!attempt) {
      return MAX_ATTEMPTS;
    }

    return Math.max(0, MAX_ATTEMPTS - attempt.attempts);
  }
}

module.exports = new LoginAttemptService();
