require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const SMS_ENABLED = process.env.SMS_ENABLED === 'true';

let twilioClient = null;

if (SMS_ENABLED) {
    try {
        const twilio = require('twilio');
        twilioClient = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );
        console.log('[SMS] Twilio client initialised successfully');
    } catch (err) {
        console.error('[SMS] Failed to initialise Twilio client:', err.message);
    }
}
/**
 @param {string} to   - E.164 format phone number e.g. '+94711234567'
 @param {string} body - SMS message text
 @returns {Promise<{success: boolean, sid?: string, error?: string}>}
*/
const sendSMS = async (to, body) => {
    if (!SMS_ENABLED || !twilioClient) {
        console.warn('[SMS] SMS sending is disabled or Twilio client not available');
        return { success: false, skipped: true };
    }
 