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