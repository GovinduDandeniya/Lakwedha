/**
 * OTP Store Utility
 * Provides an in-memory store for OTPs with a 5-minute expiration mechanism.
 */

// In-memory store: Map<phoneNumber, { otp: string, expiresAt: number }>
const otpStore = new Map();

// OTP Expiration time in milliseconds (5 minutes)
const OTP_EXPIRATION_MS = 5 * 60 * 1000;

/**
 * Store an OTP for a given phone number.
 * Automatically overwrites any existing OTP for that number.
 * @param {string} phone - The user's phone number
 * @param {string} otp - The 5-digit OTP
 */
const storeOTP = (phone, otp) => {
    const expiresAt = Date.now() + OTP_EXPIRATION_MS;
    otpStore.set(phone, { otp, expiresAt });
    
    // Auto-cleanup after 5 minutes to prevent memory leaks
    setTimeout(() => {
        const entry = otpStore.get(phone);
        // Ensure we only delete if the OTP hasn't been renewed in the meantime
        if (entry && entry.expiresAt === expiresAt) {
            otpStore.delete(phone);
            console.log(`🧹 OTP Store: Auto-cleaned expired OTP for ${phone}`);
        }
    }, OTP_EXPIRATION_MS);
};

/**
 * Verify an OTP for a given phone number.
 * @param {string} phone - The user's phone number
 * @param {string} incomingOtp - The OTP provided by the user
 * @returns {object} { valid: boolean, message: string }
 */
const verifyOTP = (phone, incomingOtp) => {
    const entry = otpStore.get(phone);

    if (!entry) {
        return { valid: false, message: 'OTP not found or has expired' };
    }

    if (Date.now() > entry.expiresAt) {
        otpStore.delete(phone); // Cleanup
        return { valid: false, message: 'OTP has expired' };
    }

    if (entry.otp !== incomingOtp) {
        return { valid: false, message: 'Invalid OTP' };
    }

    // OTP is valid! Delete it so it can't be reused
    otpStore.delete(phone);
    return { valid: true, message: 'OTP verified successfully' };
};

module.exports = { storeOTP, verifyOTP };
