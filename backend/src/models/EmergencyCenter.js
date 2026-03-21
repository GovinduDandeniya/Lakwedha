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
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true }, // [longitude, latitude]
        },
        is24Hours: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

emergencyCenterSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('EmergencyCenter', emergencyCenterSchema);
