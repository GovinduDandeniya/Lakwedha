const availabilityService = require('../services/availability.service');
const { validateAvailability } = require('../validators/availability.validator');

/**
 * Create availability session
 * POST /api/v1/doctor-channeling/availability
 */
exports.createAvailability = async (req, res) => {
    try {
        const { error } = validateAvailability(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: error.details[0].message
            });
        }

        const availability = await availabilityService.createAvailability(
            req.user.id, // doctorId from auth middleware
            req.body
        );

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
 * GET /api/v1/doctor-channeling/availability
 */
exports.getAvailability = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        const doctorId = req.params.doctorId || req.user.id;

        const availability = await availabilityService.getAvailability(
            doctorId,
            fromDate,
            toDate
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

/**
 * Update availability slot
 * PATCH /api/v1/doctor-channeling/availability/slot/:slotId
 */
exports.updateSlot = async (req, res) => {
    try {
        const { slotId } = req.params;
        const updates = req.body;

        const availability = await availabilityService.updateSlot(
            req.user.id,
            slotId,
            updates
        );

        res.status(200).json({
            success: true,
            data: availability,
            message: 'Slot updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Delete availability
 * DELETE /api/v1/doctor-channeling/availability/:availabilityId
 */
exports.deleteAvailability = async (req, res) => {
    try {
        const { availabilityId } = req.params;

        await availabilityService.deleteAvailability(req.user.id, availabilityId);

        res.status(200).json({
            success: true,
            message: 'Availability deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};