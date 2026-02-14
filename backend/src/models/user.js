const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
            select: false,
        },
        role: {
            type: String,
            enum: ['user', 'admin', 'doctor', 'pharmacy'],
            default: 'user',
        },
        status: {
            type: String,
            enum: ['pending', 'active', 'suspended', 'rejected'],
            default: function () {
                return ['doctor', 'pharmacy'].includes(this.role) ? 'pending' : 'active';
            },
        },
        phone: { type: String, trim: true },

        // Doctor-specific fields
        specialty: { type: String, trim: true },
        experience: { type: String, trim: true },
        qualifications: { type: String, trim: true },

        // Pharmacy-specific fields
        pharmacyName: { type: String, trim: true },
        licenseNumber: { type: String, trim: true },
        address: { type: String, trim: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
