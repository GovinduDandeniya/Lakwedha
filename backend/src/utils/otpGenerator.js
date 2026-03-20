/**
 * OTP Generator Utility
 * Generates a random 5-digit OTP for the notification system.
 */

const generateOTP = () => {
    const otp = Math.floor(10000 + Math.random() * 90000);
    return otp.toString();
};

module.exports = { generateOTP };
