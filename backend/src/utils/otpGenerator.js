/**
 * OTP Generator Utility
 * Generates a random 5-digit OTP for the notification system.
 */

/**
 * Generates a 5-digit Original Time Password (OTP).
 * @returns {string} 5-digit number as a string (e.g. "04932")
 */
const generateOTP = () => {
    // Generate a random number between 10000 and 99999
    // Math.random() is sufficient for this simple use case.
    const otp = Math.floor(10000 + Math.random() * 90000);
    return otp.toString();
};

module.exports = { generateOTP };
