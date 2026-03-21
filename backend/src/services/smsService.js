/**
 * SMS Service — Notify.lk Gateway
 * Sends SMS via Notify.lk API using credentials from .env:
 *   NOTIFY_USER_ID    — your Notify.lk user ID
 *   NOTIFY_API_KEY    — your Notify.lk API key
 *   NOTIFY_SENDER_ID  — your approved sender ID (e.g. "NotifyDEMO")
 *
 * Phone numbers must be E.164 format (e.g. +94771234567).
 * Notify.lk expects the number without the leading '+' (e.g. 94771234567).
 */

const https = require('https');

/**
 * Send an SMS via Notify.lk.
 * @param {string} to      - Recipient phone in E.164 format (+94771234567)
 * @param {string} message - SMS body text
 * @returns {Promise<{success: boolean, error?: string}>}
 */
const sendSMS = (to, message) => {
  return new Promise((resolve) => {
    const userId   = process.env.NOTIFY_USER_ID;
    const apiKey   = process.env.NOTIFY_API_KEY;
    const senderId = process.env.NOTIFY_SENDER_ID;

    if (!userId || !apiKey || !senderId) {
      console.warn('[SMS] Missing NOTIFY_USER_ID / NOTIFY_API_KEY / NOTIFY_SENDER_ID — SMS not sent');
      resolve({ success: false, error: 'SMS credentials not configured' });
      return;
    }

    // Strip leading '+' — Notify.lk expects plain digits (e.g. 94771234567)
    const toFormatted = to.replace(/^\+/, '');

    const params = new URLSearchParams({
      user_id:   userId,
      api_key:   apiKey,
      sender_id: senderId,
      to:        toFormatted,
      message,
    });

    const url = `https://app.notify.lk/api/v1/send?${params.toString()}`;

    https.get(url, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try {
          const body = JSON.parse(raw);
          // Notify.lk returns { status: 'success' } on success
          if (body.status === 'success') {
            console.log(`[SMS] Sent to ${toFormatted}`);
            resolve({ success: true });
          } else {
            console.error('[SMS] Notify.lk error:', body);
            resolve({ success: false, error: body.message || 'SMS gateway error' });
          }
        } catch {
          console.error('[SMS] Unexpected response from Notify.lk:', raw);
          resolve({ success: false, error: 'Invalid response from SMS gateway' });
        }
      });
    }).on('error', (err) => {
      console.error('[SMS] HTTPS request failed:', err.message);
      resolve({ success: false, error: err.message });
    });
  });
};

module.exports = { sendSMS };
