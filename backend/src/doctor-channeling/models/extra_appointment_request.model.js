const mongoose = require('mongoose');

const extraAppointmentRequestSchema = new mongoose.Schema({
    requestId: {
        type: String,
        unique: true,
        default: () => 'EAR-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase()
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: { type: String, required: true, maxlength: 500 },
    urgencyNote: { type: String, maxlength: 300 },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    doctorResponse: { type: String, maxlength: 300 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

extraAppointmentRequestSchema.index({ doctorId: 1, status: 1 });
extraAppointmentRequestSchema.index({ patientId: 1, createdAt: -1 });

module.exports = mongoose.model('ExtraAppointmentRequest', extraAppointmentRequestSchema);
