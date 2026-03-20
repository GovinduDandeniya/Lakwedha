/**
 * OTP Controller
 * Handles incoming requests for sending and verifying OTPs.
 */

const { generateOTP } = require('../utils/otpGenerator');
const { storeOTP, verifyOTP } = require('../utils/otpStore');
const { sendSMS } = require('../services/smsService');

/**
 * Handle POST /api/v1/otp/send-otp
 * Generates an OTP, stores it, and sends it to the user via SMS.
 */
const sendOtp = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        // Basic format validation (E.164)
        if (!phone.match(/^\+[1-9]\d{1,14}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone format. Must use E.164 (e.g. +94771234567)'
            });
        }

        // 1. Generate OTP
        const otp = generateOTP();

        // 2. Store OTP in memory
        storeOTP(phone, otp);

        // 3. Send via SMS
        const message = `Lakwedha Health System: Your verification code is ${otp}. It is valid for 5 minutes.`;
        const smsResult = await sendSMS(phone, message);

        if (!smsResult.success) {
            // Even if SMS fails (e.g. bad credentials), we still return a 500
            // so the client knows it failed.
            return res.status(500).json({
                success: false,
                message: 'Failed to send SMS OTP',
                error: smsResult.error
            });
        }

        return res.status(200).json({
            success: true,
            message: 'OTP sent successfully. Check your SMS.'
        });

    } catch (error) {
        console.error('OTP Controller Error (send):', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Handle POST /api/v1/otp/verify-otp
 * Verifies a submitted OTP against the in-memory store.
 */
const verifyOtpHandler = async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and OTP are both required'
            });
        }

        const result = verifyOTP(phone, otp);

        if (!result.valid) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }

        return res.status(200).json({
            success: true,
            message: 'OTP verified successfully'
        });

    } catch (error) {
        console.error('OTP Controller Error (verify):', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    sendOtp,
    verifyOtpHandler
};
