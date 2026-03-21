const mongoose = require('mongoose');

const emergencyCenterSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        type: {
            type: String,
            required: true,
            enum: [
                'ayurvedic_hospital',
                'ayurvedic_clinic',
                'panchakarma_center',
                'herbal_pharmacy',
                'wellness_center',
            ],
        },
        address: { type: String, required: true },
        phone: { type: String, required: true },
        emergencyPhone: { type: String },
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true }, // [longitude, latitude]
        },
        emergencyTypes: { type: [String], default: [] },
        country: { type: String, default: 'Sri Lanka' },
        is24Hours: { type: Boolean, default: false },
        operatingHours: { type: String },
        services: [{ type: String }],
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Geospatial index for nearby queries
emergencyCenterSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('EmergencyCenter', emergencyCenterSchema);
