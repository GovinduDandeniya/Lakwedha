const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        // ── Legacy / shared fields ─────────────────────────
        name: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        phone: {
            type: String,
            unique: true,
            sparse: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
            select: false,
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        // ── Extended registration fields ───────────────────
        title: {
            type: String,
            enum: ['Mr', 'Ms', 'Mrs', 'Dr', 'Prof'],
        },
        first_name: { type: String, trim: true },
        last_name:  { type: String, trim: true },
        nationality:{ type: String, trim: true },
        country_code:{ type: String, trim: true },
        birthday:   { type: Date },
        nic_type:   { type: String, enum: ['NIC', 'Passport'] },
        nic_number: { type: String, trim: true },
        phone_verified: { type: Boolean, default: false },
        is_verified:    { type: Boolean, default: false },
        // ── OTP fields for password reset ──────────────────
        otp_code: {
            type: String,
            select: false,
        },
        otp_expiry: {
            type: Date,
        },
        otp_attempts: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
