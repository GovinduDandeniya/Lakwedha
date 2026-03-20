/**
 * Email Service — Nodemailer Integration
 * Provides reusable email sending functionality for the Lakwedha notification system.
 */

const nodemailer = require('nodemailer');
const { notificationConfig } = require('../config/notification.config');

// ── Nodemailer Transporter ───────────────────────────────────────────────────
let transporter = null;

/**
 * Initialize the Nodemailer transporter with Gmail SMTP settings.
 * Called lazily on first send, or can be called explicitly at startup.
 */
const initEmailTransporter = () => {
  const { host, port, user, pass } = notificationConfig.email;

  if (!user || !pass) {
    console.error('❌ Email Service: Email credentials are missing. Emails will not be sent.');
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user: user,
        pass: pass,
      },
    });

    console.log('✅ Email Service: Nodemailer transporter initialized successfully');
    return transporter;
  } catch (error) {
    console.error('❌ Email Service: Failed to initialize transporter:', error.message);
    return null;
  }
};

module.exports = { initEmailTransporter };
