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
    if (!to) {
        return { success: false, error: 'No phone number provided' };
    }

    if (!SMS_ENABLED || !twilioClient) {
        console.log(`[SMS LOG] To: ${to} | Message: ${body}`);
        return { success: true, sid: 'log-only', skipped: true };
    }
    const attempt = async () =>
        twilioClient.messages.create({
            body,
            from: process.env.TWILIO_PHONE_NUMBER,
            to,
        });
        
    try {
        const msg = await attempt();
        console.log(`[SMS] Sent to ${to} | SID: ${msg.sid}`);
        return { success: true, sid: msg.sid };
    } catch (firstErr) {
        console.warn(`[SMS] First attempt failed (${firstErr.message}). Retrying…`);
        try {
            const msg = await attempt();
            console.log(`[SMS] Retry succeeded to ${to} | SID: ${msg.sid}`);
            return { success: true, sid: msg.sid };
        } catch (secondErr) {
            console.error(`[SMS] Both attempts failed to ${to}: ${secondErr.message}`);
            return { success: false, error: secondErr.message };
        }
    }
};

module.exports = { sendSMS, SMS_ENABLED };
