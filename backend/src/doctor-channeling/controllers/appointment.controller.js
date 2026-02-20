const Appointment = require('../models/Appointment.model');
const Availability = require('../models/Availability.model');
const queueService = require('../services/queue.service');
const notificationService = require('../services/notification.service');

/**
 * Book appointment (queue-based)
 * POST /api/v1/appointments/book
 */
exports.bookAppointment = async (req, res) => {
    try {
        const { doctorId, slotId, patientId, symptoms } = req.body;

        // Check if slot is available
        const availability = await Availability.findOne({
            'slots._id': slotId,
            'slots.isBooked': false
        });

        if (!availability) {
            // Add to queue
            const queueInfo = await queueService.addToQueue(
                doctorId,
                slotId,
                patientId
            );

            return res.status(202).json({
                success: true,
                inQueue: true,
                queuePosition: queueInfo.position,
                message: 'Added to waiting queue'
            });
        }

        // Create appointment
        const appointment = new Appointment({
            doctorId,
            patientId,
            slotTime: availability.slots.find(s => s._id == slotId).startTime,
            symptoms
        });

        await appointment.save();

        // Mark slot as booked
        availability.slots.id(slotId).isBooked = true;
        availability.slots.id(slotId).bookedBy = patientId;
        await availability.save();

        // Send notifications
        await notificationService.sendAppointmentConfirmation(appointment);

            res.status(201).json({
            success: true,
            data: appointment,
            message: 'Appointment booked successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Update appointment status
 * PUT /api/v1/appointments/:appointmentId/status
 */
exports.updateStatus = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { status, reason } = req.body;

        const appointment = await Appointment.findByIdAndUpdate(
            appointmentId,
            {
                status,
                ...(status === 'cancelled' && { cancellationReason: reason }),
                updatedAt: new Date()
            },
            { new: true }
        );

        // If cancelled, free up the slot
        if (status === 'cancelled') {
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
                // Notify next patient
                await notificationService.sendSlotAvailableNotification(nextPatient);
            }
        }

        // Send status update notification
        await notificationService.sendStatusUpdate(appointment, status);

        res.status(200).json({
            success: true,
            data: appointment
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
 * GET /api/v1/appointments/history/:userId
 */
exports.getHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role, status, fromDate, toDate } = req.query;

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
            .sort({ slotTime: -1 })
            .lean();

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