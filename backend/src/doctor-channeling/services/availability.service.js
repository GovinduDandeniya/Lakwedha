const availability = require('../models/Availability.model');

const{generateTimeSlots} = require('../utils/timeSlot.utils');

class AvailabilityService {
    /**
     * *create availability for a doctor
     */

    async createAvailability(doctorId,availabilityDate) {
        const {date, startTime, endTime, slotDuration, breaks, isRecurring, recurringPattern} = availabilityDate;

        //check if availability already exist for this date
        const existing = await availability.findOne({ doctorId, date });
        if(existing){
            throw new Error('Availability already exist for this date');
        }

        //generate time slots
        const slots = generateTimeSlots(startTime, endTime, slotDuration, breaks);

        const availability = new availability({
            doctorId,
            date,
            slots,
            breaks: breaks || [],
            isRecurring: isRecurring || false,
        });
        return await availability.save();
    }
    /**
     * *get availability for a doctor by date range
     */

    async getAvailability(doctorID, fromDate, toDate) {
        const query = {doctorID};

        if(fromDate || toDate){
            query.date = {};
            if(fromDate) query.date.$gte = new Date(fromDate);
            if(toDate) query.date.$lte = new Date(toDate);
        }
        return await availability.find(query).sort({date: 1});
    }
    /**
     * *update availability slot
     */
    async updateAvailabilitySlot(availabilityId, slotId, updates) {
        const availabilityDoc = await availability.findOneAndUpdate(
            { doctorId: availabilityId, 'slots._id': slotId },
            { $set: { 'slots.$': updates } },
            { new: true }
        );
        if(!result){
            throw new Error('Availability not found');
        }

        return result;
    }
}

module.exports = new AvailabilityService();
