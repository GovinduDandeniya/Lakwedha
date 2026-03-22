const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isBooked: { type: Boolean, default: false },
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    queuePosition: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['available', 'booked', 'blocked', 'break'],
        default: 'available'
    }
});

const availabilitySchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: { type: Date, required: true },
    slots: [timeSlotSchema],
    breaks: [{
        startTime: String,
        endTime: String,
        reason: String
    }],
    isRecurring: { type: Boolean, default: false },
    recurrencePattern: {
        frequency: { type: String, enum: ['daily', 'weekly', 'monthly'] },
        endDate: Date
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Compound index for efficient queries
availabilitySchema.index({ doctorId: 1, date: 1 }, { unique: true });

module.exports = mongoose.models.Availability || mongoose.model('Availability', availabilitySchema);
