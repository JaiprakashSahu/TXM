const logger = require('../utils/logger');

/**
 * Email provider abstraction.
 *
 * Default: mock sender that logs to console.
 * If SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS are set → uses nodemailer.
 *
 * The consumer calls sendEmail(to, subject, body) and doesn't care which
 * transport is active.
 */

let transportSend = null;

function getTransport() {
  if (transportSend) return transportSend;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    // Lazy-require nodemailer only when SMTP is configured
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT, 10),
        secure: parseInt(SMTP_PORT, 10) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });

      transportSend = async (to, subject, body) => {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || SMTP_USER,
          to,
          subject,
          text: body,
        });
      };

      logger.info('[EmailProvider] Using SMTP transport');
    } catch {
      logger.warn('[EmailProvider] nodemailer not installed — falling back to mock');
      transportSend = null;
    }
  }

  if (!transportSend) {
    // Mock transport — log to console
    transportSend = async (to, subject, body) => {
      logger.info(
        `[EmailProvider][MOCK] To: ${to} | Subject: ${subject} | Body: ${body.substring(0, 120)}...`
      );
    };
  }

  return transportSend;
}

/**
 * Send an email.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} body - Plain-text body
 */
async function sendEmail(to, subject, body) {
  const send = getTransport();
  await send(to, subject, body);
}

module.exports = { sendEmail };
