const mongoose = require('mongoose');

const emergencyCenterSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        type: {
            type: String,
            enum: ['hospital', 'clinic', 'wellness_center', 'pharmacy'],
            default: 'clinic',
        },
        address: { type: String, required: true },
        phone: { type: String, required: true },
        emergencyPhone: { type: String },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                required: true,
            },
        },
        operatingHours: { type: String },
        isOpen24Hours: { type: Boolean, default: false },
        services: [{ type: String }],
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Geospatial index for nearby queries
emergencyCenterSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('EmergencyCenter', emergencyCenterSchema);
