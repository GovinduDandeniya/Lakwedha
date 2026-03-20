/**
 * Notification Configuration
 * Centralized config loader for all notification-related environment variables.
 * Reads from .env via dotenv.
 */

require('dotenv').config();

const notificationConfig = {
  // ── Email (Nodemailer) ────────────────────────────────────
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};

/**
 * Validate that required email config values are present.
 * Logs warnings for missing values (does not throw, so app can still start).
 */
const validateConfig = () => {
  const warnings = [];

  if (!notificationConfig.email.user) warnings.push('EMAIL_USER is not set');
  if (!notificationConfig.email.pass) warnings.push('EMAIL_PASS is not set');

  if (warnings.length > 0) {
    console.warn('Notification Config Warnings:');
    warnings.forEach(w => console.warn(`   - ${w}`));
  } else {
    console.log('Notification config loaded successfully');
  }
};

module.exports = { notificationConfig, validateConfig };
