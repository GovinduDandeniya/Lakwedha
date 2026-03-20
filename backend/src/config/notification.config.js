/**
 * Notification Configuration
 * Centralized config loader for all notification-related environment variables.
 * Reads from .env via dotenv.
 */

require('dotenv').config();

const notificationConfig = {
  // ── Twilio SMS ────────────────────────────────────────────
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE,
  },

  // ── Email (Nodemailer) ────────────────────────────────────
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};

/**
 * Validate that all required config values are present.
 * Logs warnings for missing values (does not throw, so app can still start).
 */
const validateConfig = () => {
  const warnings = [];

  // Twilio checks
  if (!notificationConfig.twilio.accountSid) warnings.push('TWILIO_ACCOUNT_SID is not set');
  if (!notificationConfig.twilio.authToken) warnings.push('TWILIO_AUTH_TOKEN is not set');
  if (!notificationConfig.twilio.phoneNumber) warnings.push('TWILIO_PHONE is not set');

  // Email checks
  if (!notificationConfig.email.user) warnings.push('EMAIL_USER is not set');
  if (!notificationConfig.email.pass) warnings.push('EMAIL_PASS is not set');

  if (warnings.length > 0) {
    console.warn('⚠️  Notification Config Warnings:');
    warnings.forEach(w => console.warn(`   - ${w}`));
  } else {
    console.log('✅ Notification config loaded successfully');
  }
};

module.exports = { notificationConfig, validateConfig };
