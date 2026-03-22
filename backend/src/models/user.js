const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
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
            enum: ['user', 'admin', 'doctor', 'pharmacy', 'pharmacist', 'patient', 'DOCTOR', 'PATIENT'],
            default: 'user',
        },
        status: {
            type: String,
            enum: ['pending', 'active', 'suspended', 'rejected'],
            default: function () {
                return ['doctor', 'pharmacy'].includes(this.role) ? 'pending' : 'active';
            },
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
        otp_last_sent: {
            type: Date,
        },
        // ── Session invalidation ────────────────────────────
        passwordChangedAt: {
            type: Date,
        },
        // ── Push notifications ──────────────────────────────
        fcmToken: {
            type: String,
            default: null,
        },
        // ── My Doctors ─────────────────────────────────────
        myDoctors: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RegisteredDoctor',
        }],
        // ── Doctor-specific fields ──────────────────────────
        specialty: { type: String, trim: true },
        experience: { type: String, trim: true },
        qualifications: { type: String, trim: true },
        // ── Pharmacy-specific fields ────────────────────────
        pharmacyName: { type: String, trim: true },
        licenseNumber: { type: String, trim: true },
        address: { type: String, trim: true },
        province: { type: String, trim: true },
        district: { type: String, trim: true },
        city:     { type: String, trim: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
