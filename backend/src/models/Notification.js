const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
        type: String,
        enum: [
            'BOOKING',
            'CHANNEL_CONFIRMED',
            'REMINDER',
            'STATUS_UPDATE',
            'SLOT_AVAILABLE',
            'SESSION_CANCELLED',
            'PAYMENT_CONFIRMED',
            'PAYMENT_FAILED',
            'EMERGENCY_APPROVED',
            'EMERGENCY_REJECTED',
            'PHARMACY_PRICE_SENT',
            'PHARMACY_ORDER_PAID',
        ],
        required: true,
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        default: null,
    },
    read: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
