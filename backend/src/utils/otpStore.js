/**
 * OTP Store Utility
 * In-memory store for OTPs with 5-minute auto-expiry.
 */

const otpStore = new Map();
const OTP_EXPIRATION_MS = 5 * 60 * 1000;

const storeOTP = (phone, otp) => {
    const expiresAt = Date.now() + OTP_EXPIRATION_MS;
    otpStore.set(phone, { otp, expiresAt });

    setTimeout(() => {
        const entry = otpStore.get(phone);
        if (entry && entry.expiresAt === expiresAt) {
            otpStore.delete(phone);
        }
    }, OTP_EXPIRATION_MS);
};

const verifyOTP = (phone, incomingOtp) => {
    const entry = otpStore.get(phone);

    if (!entry) return { valid: false, message: 'OTP not found or has expired' };

    if (Date.now() > entry.expiresAt) {
        otpStore.delete(phone);
        return { valid: false, message: 'OTP has expired' };
    }

    if (entry.otp !== incomingOtp) return { valid: false, message: 'Invalid OTP' };

    otpStore.delete(phone);
    return { valid: true, message: 'OTP verified successfully' };
};

module.exports = { storeOTP, verifyOTP };
