/**
 * OTP Routes
 * Defines Express router paths for sending and verifying OTPs via SMS.
 */

const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otpController');

// @route   POST /api/v1/otp/send-otp
// @desc    Generate and send OTP via SMS
// @access  Public
router.post('/send-otp', otpController.sendOtp);

// @route   POST /api/v1/otp/verify-otp
// @desc    Verify SMS OTP
// @access  Public
router.post('/verify-otp', otpController.verifyOtpHandler);

module.exports = router;
