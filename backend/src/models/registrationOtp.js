const mongoose = require('mongoose');

const registrationOtpSchema = new mongoose.Schema(
    {
        phone: {
            type: String,
            required: true,
            index: true,
        },
        otp_code: {
            type: String,
            required: true,
            select: false,
        },
        otp_expiry: {
            type: Date,
            required: true,
        },
        attempts: {
            type: Number,
            default: 0,
        },
        is_verified: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Auto-delete documents 2 hours after otp_expiry
registrationOtpSchema.index({ otp_expiry: 1 }, { expireAfterSeconds: 7200 });

module.exports = mongoose.model('RegistrationOtp', registrationOtpSchema);
