const Appointment = require('../models/Appointment.model');
const Availability = require('../models/Availability.model');
const queueService = require('../services/queue.service');
const notificationService = require('../services/notification.service');
const { validateAppointment } = require('../validators/appointment.validator');

/**
 * Book appointment (queue-based)
 * POST /api/v1/doctor-channeling/appointments/book
 */
exports.bookAppointment = async (req, res) => {
    try {
        const { error } = validateAppointment(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: error.details[0].message
            });
        }

        const { doctorId, slotId, symptoms } = req.body;
        const patientId = req.user.id;

        // Find the availability and slot
        const availability = await Availability.findOne({
            'slots._id': slotId
        });

        if (!availability) {
            return res.status(404).json({
                success: false,
                error: 'Slot not found'
            });
        }

        const slot = availability.slots.id(slotId);

        // Check if slot is available
        if (!slot.isBooked) {
            // Create appointment
            const appointment = new Appointment({
                doctorId,
                patientId,
                slotTime: new Date(`${availability.date.toDateString()} ${slot.startTime}`),
                symptoms,
                status: 'confirmed'
            });

            await appointment.save();

            // Mark slot as booked
            slot.isBooked = true;
            slot.bookedBy = patientId;
            await availability.save();

            // Send notifications
            await notificationService.sendAppointmentConfirmation(appointment);

            return res.status(201).json({
                success: true,
                data: appointment,
                message: 'Appointment booked successfully'
            });
        } else {
            // Add to queue
            const slotTime = new Date(`${availability.date.toDateString()} ${slot.startTime}`);
            const queueInfo = await queueService.addToQueue(
                doctorId,
                slotTime,
                patientId
            );

            return res.status(202).json({
                success: true,
                inQueue: true,
                queuePosition: queueInfo.position,
                message: 'Added to waiting queue'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Update appointment status
 * PATCH /api/v1/doctor-channeling/appointments/:appointmentId/status
 */
exports.updateStatus = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { status, reason } = req.body;

        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                error: 'Appointment not found'
            });
        }

        // Check authorization (doctor or patient)
        if (req.user.id !== appointment.doctorId.toString() && 
        req.user.id !== appointment.patientId.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized'
            });
        }

        appointment.status = status;
        appointment.updatedAt = new Date();

        if (status === 'cancelled') {
            appointment.cancellationReason = reason;

            // Free up the slot
            await Availability.findOneAndUpdate(
                { 'slots._id': appointment.slotId },
                {
                    $set: {
                        'slots.$.isBooked': false,
                        'slots.$.bookedBy': null
                    }
                }
            );

            // Check queue for next patient
            const nextPatient = await queueService.processNextInQueue(
                appointment.doctorId,
                appointment.slotTime
            );

            if (nextPatient) {
                await notificationService.sendSlotAvailableNotification(
                    nextPatient.patientId,
                    appointment.doctorId,
                    appointment.slotTime
                );
            }
        }

        await appointment.save();
        await notificationService.sendStatusUpdate(appointment, status);

        res.status(200).json({
            success: true,
            data: appointment,
            message: `Appointment ${status} successfully`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Get appointment history
 * GET /api/v1/doctor-channeling/appointments/history
 */
exports.getHistory = async (req, res) => {
    try {
        const { role, status, fromDate, toDate } = req.query;
        const userId = req.user.id;

        const query = {};

        // Filter by role
        if (role === 'doctor') {
            query.doctorId = userId;
        } else if (role === 'patient') {
            query.patientId = userId;
        }

        // Filter by status
        if (status && status !== 'all') {
            query.status = status;
        }

        // Filter by date range
        if (fromDate || toDate) {
            query.slotTime = {};
            if (fromDate) query.slotTime.$gte = new Date(fromDate);
            if (toDate) query.slotTime.$lte = new Date(toDate);
        }

        const appointments = await Appointment.find(query)
            .populate('doctorId', 'name specialization profileImage')
            .populate('patientId', 'name age gender')
            .sort({ slotTime: -1 });

        // Group by status
        const grouped = {
            upcoming: appointments.filter(a => ['pending', 'confirmed'].includes(a.status)),
            past: appointments.filter(a => ['completed', 'cancelled', 'no-show'].includes(a.status))
        };

        res.status(200).json({
            success: true,
            data: grouped,
            total: appointments.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Get queue status for a slot
 * GET /api/v1/doctor-channeling/appointments/queue/:slotId
 */
exports.getQueueStatus = async (req, res) => {
    try {
        const { slotId } = req.params;

        const availability = await Availability.findOne({
            'slots._id': slotId
        });

        if (!availability) {
            return res.status(404).json({
                success: false,
                error: 'Slot not found'
            });
        }

        const slot = availability.slots.id(slotId);
        const slotTime = new Date(`${availability.date.toDateString()} ${slot.startTime}`);

        const queueStatus = await queueService.getQueueStatus(
            availability.doctorId,
            slotTime
        );

        res.status(200).json({
            success: true,
            data: queueStatus
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};