const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    appointmentId: {
        type: String,
        unique: true,
        default: () => 'APPT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
  slotId: { type: mongoose.Schema.Types.ObjectId },
  slotTime: { type: Date, required: true },
  hospitalName: { type: String, default: null },
  appointmentNumber: { type: Number, default: null },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled', 'no-show'],
    default: 'pending'
  },
  queuePosition: { type: Number },
  symptoms: { type: String, maxlength: 500 },
  notes: { type: String },
  cancellationReason: { type: String },
  rescheduledFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  cancellationFee: { type: Number, default: 0 },
  reminderSent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for faster queries
appointmentSchema.index({ doctorId: 1, status: 1 });
appointmentSchema.index({ patientId: 1, slotTime: -1 });
appointmentSchema.index({ slotTime: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);