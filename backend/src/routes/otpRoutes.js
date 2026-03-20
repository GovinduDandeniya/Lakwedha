/**
 * OTP Routes
 * POST /api/v1/otp/send-otp   — Generate and send OTP via SMS
 * POST /api/v1/otp/verify-otp — Verify submitted OTP
 */

const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtpHandler } = require('../controllers/otpController');

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtpHandler);

module.exports = router;
