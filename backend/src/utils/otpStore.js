/**
 * OTP Store — DEPRECATED
 * Replaced by models/otp.model.js (MongoDB-backed).
 * Kept here only to avoid import errors if referenced elsewhere.
 * otpController.js no longer uses this file.
 */

module.exports = { storeOTP: () => {}, verifyOTP: () => ({ valid: false, message: 'Deprecated' }) };
