const mongoose = require('mongoose');

const pharmacyRequestSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        pharmacyId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

        patientDetails: {
            firstName: { type: String, required: true, trim: true },
            lastName:  { type: String, required: true, trim: true },
            address:   { type: String, required: true, trim: true },
            mobile:    { type: String, required: true, trim: true },
        },

        prescriptionFileUrl: { type: String, required: true },

        location: {
            province: { type: String },
            district: { type: String },
            city:     { type: String },
        },

        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'price_sent', 'paid', 'processing', 'completed', 'cancelled'],
            default: 'pending',
            index: true,
        },

        price:           { type: Number, default: null },
        rejectionReason: { type: String, default: null },
        paymentStatus:   { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
        paidAt:          { type: Date, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('PharmacyRequest', pharmacyRequestSchema);
