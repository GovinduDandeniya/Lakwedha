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

/**
 * Send an SMS message via Twilio.
 * @param {string} to - Recipient phone number (E.164 format, e.g. +94771234567)
 * @param {string} message - SMS body text
 * @returns {Promise<object>} - Twilio message response or error object
 */
const sendSMS = async (to, message) => {
  try {
    // Lazy-initialize client if not yet created
    if (!client) {
      const initialized = initTwilioClient();
      if (!initialized) {
        throw new Error('Twilio client is not initialized. Check your credentials.');
      }
    }

    // Validate phone number format (basic E.164 check)
    if (!to || !to.match(/^\+[1-9]\d{1,14}$/)) {
      throw new Error(`Invalid phone number format: ${to}. Use E.164 format (e.g. +94771234567)`);
    }

    // Validate message content
    if (!message || message.trim().length === 0) {
      throw new Error('SMS message body cannot be empty');
    }

    console.log(`📱 SMS Service: Sending SMS to ${to}...`);

    const result = await client.messages.create({
      body: message,
      from: notificationConfig.twilio.phoneNumber,
      to: to,
    });

    console.log(`✅ SMS Service: Message sent successfully (SID: ${result.sid})`);

    return {
      success: true,
      messageSid: result.sid,
      to: result.to,
      status: result.status,
    };
  } catch (error) {
    console.error(`❌ SMS Service: Failed to send SMS to ${to}:`, error.message);

    return {
      success: false,
      error: error.message,
      to: to,
    };
  }
};

module.exports = { initTwilioClient, sendSMS };
