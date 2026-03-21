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
            enum: ['user', 'admin', 'pharmacist'],
            default: 'user',
        },
        province: { type: String, trim: true },
        district: { type: String, trim: true },
        city:     { type: String, trim: true },
        address:  { type: String, trim: true },
        phone:    { type: String, trim: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
