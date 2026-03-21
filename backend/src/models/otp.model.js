const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    mobile:    { type: String, required: true, index: true },
    otp:       { type: String, required: true },
    expiresAt: { type: Date,   required: true },
    attempts:  { type: Number, default: 0 },
});

// MongoDB TTL index: auto-delete the document 10 minutes after expiresAt
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 600 });

module.exports = mongoose.model('OTP', otpSchema);
