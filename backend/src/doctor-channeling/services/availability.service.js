const Availability = require('../models/availability.model');
const { generateTimeSlots } = require('../utils/timeSlot.utils');

class AvailabilityService {
    async createAvailability(doctorId, availabilityData) {
        const { date, startTime, endTime, slotDuration, breaks, isRecurring, recurrencePattern } = availabilityData;

        const existing = await Availability.findOne({ doctorId, date });
        if (existing) {
            throw new Error('Availability already exists for this date');
        }

        const slots = generateTimeSlots(startTime, endTime, slotDuration, breaks);

        const doc = new Availability({
            doctorId,
            date,
            slots,
            breaks: breaks || [],
            isRecurring: isRecurring || false,
            recurrencePattern: recurrencePattern || undefined,
        });
        return await doc.save();
    }

    async getAvailability(doctorId, fromDate, toDate) {
        const query = { doctorId };

        if (fromDate || toDate) {
            query.date = {};
            if (fromDate) query.date.$gte = new Date(fromDate);
            if (toDate) query.date.$lte = new Date(toDate);
        }
        return await Availability.find(query).sort({ date: 1 });
    }

    async updateSlot(doctorId, slotId, updates) {
        const result = await Availability.findOneAndUpdate(
            { doctorId, 'slots._id': slotId },
            { $set: { 'slots.$': updates } },
            { new: true }
        );
        if (!result) {
            throw new Error('Availability not found');
        }
        return result;
    }

    async deleteAvailability(doctorId, availabilityId) {
        const result = await Availability.findOneAndDelete({ _id: availabilityId, doctorId });
        if (!result) {
            throw new Error('Availability not found');
        }
        return result;
    }
}

module.exports = new AvailabilityService();
