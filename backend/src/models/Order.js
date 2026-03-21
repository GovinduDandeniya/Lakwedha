const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        prescriptionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Prescription',
            required: true,
            index: true,
        },
        pharmacyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        medicines: [
            {
                name: String,
                quantity: Number,
                price: Number,
            },
        ],
        subtotal: { type: Number, default: 0 },
        deliveryFee: { type: Number, default: 0 },
        tax: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },

        status: {
            type: String,
            enum: ['pending', 'approved', 'processing', 'shipped', 'completed', 'cancelled', 'rejected'],
            default: 'pending'
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed'],
            default: 'pending'
        },
        paymentMethod: {
            type: String,
            enum: ['online', 'cod'],
            default: 'online'
        },

        statusHistory: [
            {
                from: String,
                to: String,
                changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                changedAt: { type: Date, default: Date.now },
                reason: String
            }
        ]
    },
    { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
