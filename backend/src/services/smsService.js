/**
 * SMS Service — Stub
 * Twilio was removed from this project (see commit 47ea821).
 * This stub logs the message instead of sending it.
 * To enable real SMS: install twilio, add TWILIO_* vars to .env, and replace this file.
 */

/**
 * @param {string} to - Recipient phone number (E.164 format)
 * @param {string} message - SMS body text
 * @returns {Promise<object>}
 */
const sendSMS = async (to, message) => {
  console.log(`SMS Service (stub): to=${to} | message=${message}`);
  return { success: false, error: 'SMS service not configured' };
};

module.exports = { sendSMS };
