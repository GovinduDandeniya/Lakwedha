const express = require('express');
const rateLimit = require('express-rate-limit');
const { sendOtp, verifyOtp, register } = require('../controllers/registration.controller');

const router = express.Router();

const sendOtpLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: { message: 'Too many OTP requests. Please try again after an hour.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const verifyOtpLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { message: 'Too many verification attempts. Please try again later.' },
});

const registerLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: { message: 'Too many registration attempts. Please try again later.' },
});

router.post('/send-otp',  sendOtpLimit,  sendOtp);
router.post('/verify-otp', verifyOtpLimit, verifyOtp);
router.post('/register',  registerLimit, register);

module.exports = router;
