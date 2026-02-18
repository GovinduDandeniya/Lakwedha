const Availability = require('../models/Availability.model');
const { generateTimeSlots } = require('../utils/timeSlot.utils');

/**
 * Create availability session
 * POST /api/v1/doctors/availability
 */
exports.createAvailability = async (req, res) => {
    try {
        const { doctorId, date, startTime, endTime, slotDuration, breaks } = req.body;

        // Generate time slots based on duration
        const slots = generateTimeSlots(startTime, endTime, slotDuration, breaks);

        const availability = new Availability({
            doctorId,
            date,
            slots,
            breaks
        });

        await availability.save();

        res.status(201).json({
            success: true,
            data: availability,
            message: 'Availability created successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Get doctor availability
 * GET /api/v1/doctors/availability/:doctorId
 */
exports.getAvailability = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { fromDate, toDate } = req.query;

        const query = { doctorId };

        if (fromDate || toDate) {
            query.date = {};
            if (fromDate) query.date.$gte = new Date(fromDate);
            if (toDate) query.date.$lte = new Date(toDate);
        }

        const availability = await Availability.find(query)
            .sort({ date: 1 })
            .lean();

        res.status(200).json({
            success: true,
            data: availability
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Update availability slot
 * PATCH /api/v1/doctors/availability/slot/:slotId
 */
exports.updateSlot = async (req, res) => {
    try {
        const { slotId } = req.params;
        const { status, isBooked } = req.body;

        const availability = await Availability.findOneAndUpdate(
            { 'slots._id': slotId },
            {
                $set: {
                    'slots.$.status': status,
                    'slots.$.isBooked': isBooked
                }
            },
            { new: true }
        );

        res.status(200).json({
            success: true,
            data: availability
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};