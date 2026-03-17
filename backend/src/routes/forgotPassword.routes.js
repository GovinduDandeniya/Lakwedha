const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { sendOtp, verifyOtp, resetPassword } = require('../controllers/forgotPassword.controller');

// Rate-limit: max 5 OTP requests per IP per hour
const sendOtpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many OTP requests from this IP. Please try again after an hour.' },
});

// Rate-limit: max 20 verify attempts per 15 min
const verifyOtpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many verification attempts. Please wait 15 minutes.' },
});

// Rate-limit: max 10 reset attempts per 15 min
const resetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many reset attempts. Please wait 15 minutes.' },
});

router.post('/send-otp', sendOtpLimiter, sendOtp);
router.post('/verify-otp', verifyOtpLimiter, verifyOtp);
router.post('/reset-password', resetLimiter, resetPassword);

module.exports = router;
