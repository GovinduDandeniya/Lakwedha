const mongoose = require('mongoose');

const channelingSessionSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  hospitalName: {
    type: String,
    required: true,
    trim: true,
  },
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: true, // stored as "HH:mm" e.g. "18:00"
  },
  totalAppointments: {
    type: Number,
    required: true,
    min: 1,
  },
  bookedCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  status: {
    type: String,
    enum: ['open', 'full', 'closed', 'completed', 'cancelled'],
    default: 'open',
  },
  note: {
    type: String,
    maxlength: 200,
    default: '',
  },
  hospitalCharge: {
    type: Number,
    default: 0,
    min: 0,
  },
  cancellationCharge: {
    type: Number,
    default: 0,
    min: 0,
  },
  extraRequestsEnabled: {
    type: Boolean,
    default: false,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Prevent duplicate sessions for same doctor/hospital/date/time
channelingSessionSchema.index(
  { doctorId: 1, hospitalName: 1, date: 1, startTime: 1 },
  { unique: true },
);
channelingSessionSchema.index({ doctorId: 1, date: 1 });
channelingSessionSchema.index({ date: 1, status: 1 });

module.exports =
  mongoose.models.ChannelingSession ||
  mongoose.model('ChannelingSession', channelingSessionSchema);
