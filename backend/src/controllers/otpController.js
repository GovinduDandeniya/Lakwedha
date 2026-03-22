/**
 * OTP Controller
 * Handles sending and verifying OTPs via SMS (Notify.lk).
 *
 * Routes (mounted at /api/v1/otp):
 *   POST /send-otp   — generate OTP, save to DB, send via SMS
 *   POST /verify-otp — validate OTP, handle expiry & attempt limits
 */

const OTP           = require('../models/otp.model');
const { sendSMS }   = require('../services/smsService');
const formatLKNumber = require('../utils/phone');
const { generateOTP } = require('../utils/otpGenerator');

/* ── POST /api/v1/otp/send-otp ────────────────────────────────────────────── */
// Body: { phone }  — accepts any SL format: "0713316679", "+94713316679", etc.
const sendOtp = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }

        const mobile = formatLKNumber(phone);

        // Validate: must be 94 + 9 digits = 11 digits total
        if (!/^94\d{9}$/.test(mobile)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number. Use format: 07XXXXXXXX or +94XXXXXXXXX',
            });
        }

        const otp       = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Save or update OTP record for this mobile number
        await OTP.findOneAndUpdate(
            { mobile },
            { otp, expiresAt, attempts: 0 },
            { upsert: true, new: true }
        );

        const message = `Your Lakwedha OTP is ${otp}. Valid for 5 minutes. Do not share this code.`;

        // sendSMS expects E.164 — prefix '+' back for the gateway call
        const smsSent = await sendSMS('+' + mobile, message);

        // Block if SMS delivery failed
        if (!smsSent.success) {
            return res.status(500).json({
                success: false,
                message: 'OTP failed to send via SMS',
                error: smsSent.error,
            });
        }

        console.log(`[OTP] Sent to ${mobile}`);
        return res.status(200).json({ success: true, message: 'OTP sent successfully. Check your SMS.' });
    } catch (error) {
        console.error('[OTP] sendOtp error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/* ── POST /api/v1/otp/verify-otp ──────────────────────────────────────────── */
// Body: { phone, otp }
const verifyOtpHandler = async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and OTP are both required',
            });
        }

        const mobile = formatLKNumber(phone);
        const record = await OTP.findOne({ mobile });

        // No OTP found
        if (!record) {
            return res.status(400).json({
                success: false,
                message: 'OTP not found. Please request a new one.',
            });
        }

        // Expired
        if (record.expiresAt < new Date()) {
            await OTP.deleteOne({ mobile });
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new one.',
            });
        }

        // Too many wrong attempts
        if (record.attempts >= 5) {
            return res.status(429).json({
                success: false,
                message: 'Too many incorrect attempts. Please request a new OTP.',
            });
        }

        // Wrong OTP
        if (record.otp !== String(otp)) {
            record.attempts += 1;
            await record.save();
            const remaining = 5 - record.attempts;
            return res.status(400).json({
                success: false,
                message: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
            });
        }

        // Correct — clean up and confirm
        await OTP.deleteOne({ mobile });
        return res.status(200).json({ success: true, message: 'OTP verified successfully.' });
    } catch (error) {
        console.error('[OTP] verifyOtpHandler error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { sendOtp, verifyOtpHandler };
