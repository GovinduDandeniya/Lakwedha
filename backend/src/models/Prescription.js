const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        imageUrl: { type: String, required: true },
        patientName: { type: String, default: 'Anonymous Patient' },

        doctorStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },

        pharmacyStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },

        medicines: [
            {
                name: String,
                quantity: Number,
                price: Number
            }
        ],

        pharmacyNote: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Prescription', prescriptionSchema);
