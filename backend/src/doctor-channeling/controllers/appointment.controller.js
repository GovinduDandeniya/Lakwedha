const Appointment = require('../models/appointment.model');
const Availability = require('../models/availability.model');
const ExtraAppointmentRequest = require('../models/extra_appointment_request.model');
const ChannelingSession = require('../models/channelingSession.model');
const RegisteredDoctor = require('../../models/RegisteredDoctor');
const LegacyDoctor = require('../models/doctor.model');
const queueService = require('../services/queue.service');
const notificationService = require('../services/notification.service');
const { validateAppointment, validateStatusUpdate } = require('../validators/appointment.validator');
const crypto = require('crypto');

const HOSPITAL_CHARGE = 500;
const CHANNELING_CHARGE = 300;

function generatePayhereHash(merchantId, orderId, amount, currency, merchantSecret) {
    const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
    return crypto.createHash('md5')
        .update(merchantId + orderId + amount + currency + hashedSecret)
        .digest('hex')
        .toUpperCase();
}

async function resolveDoctorName(doctorId) {
    const reg = await RegisteredDoctor.findById(doctorId).select('fullName firstName lastName specialization').lean();
    if (reg) {
        return {
            _id: reg._id,
            name: reg.fullName || `${reg.firstName || ''} ${reg.lastName || ''}`.trim() || 'Doctor',
            specialization: reg.specialization || '',
        };
    }
    const leg = await LegacyDoctor.findById(doctorId).select('name specialization').lean();
    if (leg) {
        return { _id: leg._id, name: leg.name || 'Doctor', specialization: leg.specialization || '' };
    }
    return null;
}

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
            // Calculate total fee
            const doctor = await RegisteredDoctor.findById(doctorId).select('consultationFee').lean();
            const consultationFee = (doctor && doctor.consultationFee) ? doctor.consultationFee : 1500;
            const totalFee = consultationFee + HOSPITAL_CHARGE + CHANNELING_CHARGE;

            // Create appointment — status is 'pending' until payment is confirmed
            const appointment = new Appointment({
                doctorId,
                patientId,
                slotId,
                slotTime: new Date(`${availability.date.toDateString()} ${slot.startTime}`),
                symptoms,
                status: 'pending',
                paymentStatus: 'pending',
                totalFee
            });

            await appointment.save();

            // Mark slot as booked
            slot.isBooked = true;
            slot.bookedBy = patientId;
            await availability.save();

            return res.status(201).json({
                success: true,
                data: appointment,
                message: 'Appointment reserved. Please complete payment to confirm.',
                paymentRequired: true,
                totalFee
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

        const { error } = validateStatusUpdate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: error.details[0].message
            });
        }

        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                error: 'Appointment not found'
            });
        }

        if (status === 'cancelled') {
            const isAdmin = req.user.role === 'admin';
            const isDoctorOwner = req.user.role === 'doctor' &&
                req.user.id === appointment.doctorId.toString();

            if (!isAdmin && !isDoctorOwner) {
                return res.status(403).json({
                    success: false,
                    error: 'Only the assigned doctor or an admin can cancel appointments'
                });
            }

            // Doctors must cancel at least 12 hours before the appointment
            if (isDoctorOwner) {
                const hoursUntil = (new Date(appointment.slotTime) - new Date()) / (1000 * 60 * 60);
                if (hoursUntil < 12) {
                    return res.status(400).json({
                        success: false,
                        error: 'Appointments can only be cancelled at least 12 hours before the scheduled time'
                    });
                }
            }
        }

        // For non-cancel status updates only the assigned doctor or patient is allowed
        if (status !== 'cancelled' &&
            req.user.id !== appointment.doctorId.toString() &&
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

            // If already paid, deduct 10% as cancel fee
            if (appointment.paymentStatus === 'paid') {
                // Get doctor fee
                const Doctor = require('../models/doctor.model');
                const doctor = await Doctor.findById(appointment.doctorId);
                let doctorFee = doctor && doctor.consultationFee ? doctor.consultationFee : 1500;
                // You may want to include hospital and channeling charges if needed
                const hospitalCharge = 500;
                const channelingCharge = 300;
                const totalAmount = doctorFee + hospitalCharge + channelingCharge;
                const cancelFee = Math.round(totalAmount * 0.10);
                // Here, you would trigger refund minus cancelFee (pseudo-code):
                // await paymentService.refund(appointment, totalAmount - cancelFee);
                appointment.cancellationFee = cancelFee;
                appointment.paymentStatus = 'refunded';
            }

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
            .populate('patientId', 'name age gender')
            .sort({ slotTime: -1 })
            .lean();

        // Resolve doctor names — populate may fail when ref mismatches legacy Doctor IDs
        await Promise.all(appointments.map(async (appt) => {
            if (appt.doctorId && typeof appt.doctorId !== 'object') {
                appt.doctorId = await resolveDoctorName(appt.doctorId);
            } else if (appt.doctorId && typeof appt.doctorId === 'object' && !appt.doctorId.name) {
                const resolved = await resolveDoctorName(appt.doctorId._id || appt.doctorId);
                if (resolved) appt.doctorId = resolved;
            }
        }));

        // Group by status
        const grouped = {
            upcoming: appointments.filter(a => ['pending', 'confirmed', 'cancel_requested'].includes(a.status)),
            past: appointments.filter(a => ['completed', 'cancelled', 'no-show', 'rescheduled'].includes(a.status))
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
 * Get single appointment by ID
 * GET /api/v1/doctor-channeling/appointments/:appointmentId
 */
exports.getAppointmentById = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        const appointment = await Appointment.findById(appointmentId)
            .populate('doctorId', 'fullName firstName lastName specialization consultationFee')
            .populate('patientId', 'name age gender phone');

        if (!appointment) {
            return res.status(404).json({
                success: false,
                error: 'Appointment not found'
            });
        }

        // Only the patient, doctor, or admin can view the appointment
        const userId = req.user.id;
        const isOwner =
            userId === appointment.patientId._id.toString() ||
            userId === appointment.doctorId._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized'
            });
        }

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

/**
 * GET /api/v1/doctor-channeling/appointments/extra-requests
 * Doctor: list their extra appointment requests
 */
exports.getExtraRequests = async (req, res) => {
    try {
        const requests = await ExtraAppointmentRequest.find({ doctorId: req.user.id })
            .sort({ createdAt: -1 })
            .populate('patientId', 'name phone email birthday gender')
            .populate('sessionId', 'hospitalName date startTime');

        const data = requests.map(r => ({
            _id: r._id,
            requestId: r.requestId,
            sessionId: r.sessionId,
            status: r.status,
            reason: r.reason,
            urgencyNote: r.urgencyNote,
            doctorResponse: r.doctorResponse,
            createdAt: r.createdAt,
            patient: r.patientId ? {
                name: r.patientId.name,
                phone: r.patientId.phone,
                email: r.patientId.email,
                age: r.patientId.birthday
                    ? Math.floor((Date.now() - new Date(r.patientId.birthday)) / (365.25 * 24 * 3600 * 1000))
                    : null,
                gender: r.patientId.gender,
            } : null,
        }));

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * PATCH /api/v1/doctor-channeling/appointments/extra-requests/:id/respond
 * Doctor: accept or reject an extra appointment request
 */
exports.respondToExtraRequest = async (req, res) => {
    try {
        const { action, doctorResponse, sessionId } = req.body;
        if (!['accepted', 'rejected'].includes(action)) {
            return res.status(400).json({ success: false, error: 'action must be accepted or rejected' });
        }

        const request = await ExtraAppointmentRequest.findOne({
            _id: req.params.id,
            doctorId: req.user.id,
        });
        if (!request) return res.status(404).json({ success: false, error: 'Request not found' });
        if (request.status !== 'pending') {
            return res.status(400).json({ success: false, error: 'Request has already been responded to' });
        }

        request.status = action;
        request.doctorResponse = doctorResponse || '';
        request.updatedAt = new Date();

        let appointment = null;

        if (action === 'accepted') {
            // Find the session: use provided sessionId, or the one linked to the request, or next upcoming
            let session;
            const targetSessionId = sessionId || request.sessionId;
            if (targetSessionId) {
                session = await ChannelingSession.findOne({ _id: targetSessionId, doctorId: req.user.id });
            }
            if (!session) {
                const today = new Date(); today.setHours(0, 0, 0, 0);
                session = await ChannelingSession.findOne({
                    doctorId: req.user.id,
                    date: { $gte: today },
                    status: { $in: ['open', 'full'] },
                }).sort({ date: 1, startTime: 1 });
            }
            if (!session) {
                return res.status(404).json({ success: false, error: 'No upcoming session found to attach this appointment to' });
            }
            if (['cancelled', 'closed', 'completed'].includes(session.status)) {
                return res.status(400).json({ success: false, error: `Session is ${session.status} and cannot accept appointments` });
            }

            // Increment bookedCount — extra request bypasses the full limit
            session.bookedCount += 1;
            const appointmentNumber = session.bookedCount;
            if (session.bookedCount >= session.totalAppointments && session.status === 'open') {
                session.status = 'full';
            }
            session.updatedAt = new Date();
            await session.save();

            const [startHour, startMin] = session.startTime.split(':').map(Number);
            const slotTime = new Date(session.date);
            slotTime.setHours(startHour, startMin, 0, 0);

            appointment = new Appointment({
                doctorId: session.doctorId,
                patientId: request.patientId,
                slotTime,
                hospitalName: session.hospitalName,
                appointmentNumber,
                symptoms: request.reason,
                status: 'confirmed',
            });
            await appointment.save();

            request.sessionId = session._id;

            await notificationService.sendEmergencyApproval(request.patientId, appointment);
        } else {
            await notificationService.sendEmergencyRejection(request.patientId, doctorResponse || '');
        }

        await request.save();

        res.json({ success: true, data: { request, appointment } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * POST /api/v1/doctor-channeling/appointments/:id/cancel-request
 * Patient: request cancellation of their appointment (≥ 12 hours before, with reason)
 */
exports.requestCancellation = async (req, res) => {
    try {
        const { reason } = req.body;
        if (!reason || !reason.trim()) {
            return res.status(400).json({ success: false, error: 'Cancellation reason is required' });
        }

        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ success: false, error: 'Appointment not found' });
        }

        // Only the patient who owns the appointment can request cancellation
        if (appointment.patientId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        // Only active appointments can be cancelled
        if (!['pending', 'confirmed'].includes(appointment.status)) {
            return res.status(400).json({
                success: false,
                error: `Cannot cancel an appointment with status: ${appointment.status}`
            });
        }

        // 12-hour rule
        const hoursUntil = (new Date(appointment.slotTime) - new Date()) / (1000 * 60 * 60);
        if (hoursUntil < 12) {
            return res.status(400).json({
                success: false,
                error: 'Cancellation is only allowed at least 12 hours before the appointment'
            });
        }

        appointment.status = 'cancel_requested';
        appointment.cancellation = {
            reason: reason.trim(),
            requestedAt: new Date(),
        };
        appointment.updatedAt = new Date();
        await appointment.save();

        res.json({
            success: true,
            message: 'Cancellation request sent to admin for approval',
            data: appointment,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * POST /api/v1/doctor-channeling/appointments/extra-requests
 * Patient: submit an extra appointment request for a full session
 */
exports.submitExtraRequest = async (req, res) => {
    try {
        const { sessionId, reason, urgencyNote } = req.body;
        if (!sessionId || !reason) {
            return res.status(400).json({ success: false, error: 'sessionId and reason are required' });
        }

        const session = await ChannelingSession.findById(sessionId);
        if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
        if (!session.extraRequestsEnabled) {
            return res.status(403).json({ success: false, error: 'This doctor has not enabled extra appointment requests for this session' });
        }
        if (session.status !== 'full') {
            return res.status(400).json({ success: false, error: 'Extra requests are only allowed when the session is fully booked' });
        }

        const existing = await ExtraAppointmentRequest.findOne({
            sessionId,
            patientId: req.user.id,
            status: 'pending',
        });
        if (existing) {
            return res.status(409).json({ success: false, error: 'You already have a pending request for this session' });
        }

        const request = await ExtraAppointmentRequest.create({
            sessionId,
            doctorId: session.doctorId,
            patientId: req.user.id,
            reason,
            urgencyNote: urgencyNote || '',
        });

        res.status(201).json({ success: true, data: request });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * POST /api/v1/doctor-channeling/appointments/:id/pay/initiate
 * Patient: get PayHere payment parameters for a pending appointment
 */
exports.initiateAppointmentPayment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ success: false, error: 'Appointment not found' });
        }
        if (appointment.patientId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }
        if (appointment.paymentStatus === 'paid') {
            return res.status(400).json({ success: false, error: 'This appointment has already been paid' });
        }

        const merchantId = process.env.PAYHERE_MERCHANT_ID?.trim();
        const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET?.trim();
        const orderId = appointment._id.toString();
        const amount = appointment.totalFee.toFixed(2);
        const currency = 'LKR';

        const hash = generatePayhereHash(merchantId, orderId, amount, currency, merchantSecret);

        res.json({
            success: true,
            data: {
                sandbox: process.env.PAYHERE_SANDBOX?.trim() === 'true',
                merchant_id: merchantId,
                return_url: `${process.env.BACKEND_URL}/api/v1/doctor-channeling/appointments/pay/return`,
                cancel_url: `${process.env.BACKEND_URL}/api/v1/doctor-channeling/appointments/pay/cancel`,
                notify_url: `${process.env.BACKEND_URL}/api/v1/doctor-channeling/appointments/pay/notify`,
                order_id: orderId,
                items: 'Doctor Channeling Fee',
                amount,
                currency,
                hash,
                first_name: 'Patient',
                last_name: '',
                email: 'patient@lakwedha.com',
                phone: '0771234567',
                address: 'Sri Lanka',
                city: 'Colombo',
                country: 'Sri Lanka'
            },
            message: 'Payment parameters generated'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * POST /api/v1/doctor-channeling/appointments/pay/notify
 * PayHere server-to-server webhook — no auth middleware, must verify signature
 */
exports.handleAppointmentPayhereNotification = async (req, res) => {
    try {
        const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig } = req.body;
        const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET?.trim();

        // Verify PayHere signature
        const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
        const localSig = crypto.createHash('md5')
            .update(merchant_id + order_id + payhere_amount + payhere_currency + status_code + hashedSecret)
            .digest('hex')
            .toUpperCase();

        if (localSig !== md5sig) {
            return res.status(400).json({ success: false, error: 'Invalid signature' });
        }

        // status_code 2 = successful payment
        if (status_code != 2) {
            return res.status(200).json({ success: true, message: 'Notification received' });
        }

        const appointment = await Appointment.findById(order_id);
        if (!appointment) return res.status(404).json({ success: false, error: 'Appointment not found' });
        if (appointment.paymentStatus === 'paid') return res.status(200).json({ success: true, message: 'Already paid' });

        appointment.paymentStatus = 'paid';
        appointment.paidAt = new Date();
        appointment.status = 'confirmed';
        appointment.updatedAt = new Date();
        await appointment.save();

        // Now send confirmation notification
        await notificationService.sendAppointmentConfirmation(appointment);

        res.status(200).json({ success: true, message: 'Payment confirmed' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};