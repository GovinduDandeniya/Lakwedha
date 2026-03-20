/**
 * SMS Service — Twilio Integration
 * Provides reusable SMS sending functionality for the Lakwedha notification system.
 */

const twilio = require('twilio');
const { notificationConfig } = require('../config/notification.config');

// ── Twilio Client Initialization ─────────────────────────────────────────────
let client = null;

/**
 * Initialize the Twilio client.
 * Called lazily on first send, or can be called explicitly at startup.
 */
const initTwilioClient = () => {
  const { accountSid, authToken } = notificationConfig.twilio;

  if (!accountSid || !authToken) {
    console.error('❌ SMS Service: Twilio credentials are missing. SMS will not be sent.');
    return null;
  }

  try {
    client = twilio(accountSid, authToken);
    console.log('✅ SMS Service: Twilio client initialized successfully');
    return client;
  } catch (error) {
    console.error('❌ SMS Service: Failed to initialize Twilio client:', error.message);
    return null;
  }
};

module.exports = { initTwilioClient };
