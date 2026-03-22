const ExtraAppointmentRequest = require('../models/extra_appointment_request.model');
const ChannelingSession = require('../models/channelingSession.model');
const Appointment = require('../models/appointment.model');
const notificationService = require('../services/notification.service');
const User = require('../../models/user');

/**
 * POST /api/v1/doctor-channeling/emergency-requests
 * Patient submits an emergency appointment request to a doctor.
 */
exports.submitRequest = async (req, res) => {
    try {
        const { doctorId, reason, urgencyNote } = req.body;
        const patientId = req.user.id;

        if (!doctorId || !reason) {
            return res.status(400).json({ success: false, error: 'doctorId and reason are required' });
        }

        const existing = await ExtraAppointmentRequest.findOne({ doctorId, patientId, status: 'pending' });
        if (existing) {
            return res.status(409).json({ success: false, error: 'You already have a pending emergency request for this doctor' });
        }

        const request = await ExtraAppointmentRequest.create({
            doctorId,
            patientId,
            reason,
            urgencyNote: urgencyNote || '',
        });

        await notificationService.sendEmergencyRequestReceived(doctorId);

        res.status(201).json({ success: true, data: request, message: 'Emergency request submitted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * GET /api/v1/doctor-channeling/emergency-requests
 * Doctor views emergency requests directed at them.
 */
exports.getRequests = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const { status } = req.query;

        const filter = { doctorId };
        if (status && status !== 'all') filter.status = status;

        const requests = await ExtraAppointmentRequest.find(filter)
            .populate('patientId', 'name first_name last_name email phone')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: requests, total: requests.length });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * GET /api/v1/doctor-channeling/emergency-requests/my
 * Patient views their own submitted emergency requests.
 */
exports.getMyRequests = async (req, res) => {
    try {
        const patientId = req.user.id;

        const requests = await ExtraAppointmentRequest.find({ patientId })
            .sort({ createdAt: -1 });

        res.json({ success: true, data: requests, total: requests.length });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * PATCH /api/v1/doctor-channeling/emergency-requests/:id/approve
 * Doctor approves an emergency request.
 * Creates an appointment on the specified (or next available) session,
 * bypassing the full-session limit as emergency priority.
 */
exports.approveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { sessionId, doctorResponse } = req.body;
        const doctorId = req.user.id;

        const request = await ExtraAppointmentRequest.findOne({ _id: id, doctorId });
        if (!request) return res.status(404).json({ success: false, error: 'Request not found' });
        if (request.status !== 'pending') {
            return res.status(400).json({ success: false, error: `Request is already ${request.status}` });
        }

        // Find session: use provided sessionId, or auto-pick next upcoming session
        let session;
        if (sessionId) {
            session = await ChannelingSession.findOne({ _id: sessionId, doctorId });
            if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            session = await ChannelingSession.findOne({
                doctorId,
                date: { $gte: today },
                status: { $in: ['open', 'full'] },
            }).sort({ date: 1, startTime: 1 });
        }

        if (!session) {
            return res.status(404).json({ success: false, error: 'No upcoming session found. Please release availability first.' });
        }

        if (['cancelled', 'closed', 'completed'].includes(session.status)) {
            return res.status(400).json({ success: false, error: `Session is ${session.status} and cannot accept appointments` });
        }

        // Increment bookedCount — emergency bypasses the full limit
        session.bookedCount += 1;
        const appointmentNumber = session.bookedCount;
        if (session.bookedCount >= session.totalAppointments && session.status === 'open') {
            session.status = 'full';
        }
        session.updatedAt = new Date();
        await session.save();

        // Build slotTime from session date + startTime
        const [startHour, startMin] = session.startTime.split(':').map(Number);
        const slotTime = new Date(session.date);
        slotTime.setHours(startHour, startMin, 0, 0);

        const appointment = new Appointment({
            doctorId: session.doctorId,
            patientId: request.patientId,
            slotTime,
            hospitalName: session.hospitalName,
            appointmentNumber,
            symptoms: request.reason,
            status: 'confirmed',
        });
        await appointment.save();

        // Update request status
        request.status = 'accepted';
        request.doctorResponse = doctorResponse || '';
        request.updatedAt = new Date();
        await request.save();

        // Notify patient of approval
        await notificationService.sendEmergencyApproval(request.patientId, appointment);

        // Auto-save doctor to patient's My Doctors list
        await User.findByIdAndUpdate(request.patientId, {
            $addToSet: { myDoctors: doctorId },
        });

        res.json({
            success: true,
            data: { request, appointment },
            message: 'Emergency request approved and appointment created',
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * PATCH /api/v1/doctor-channeling/emergency-requests/:id/reject
 * Doctor rejects an emergency request.
 */
exports.rejectRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { doctorResponse } = req.body;
        const doctorId = req.user.id;

        const request = await ExtraAppointmentRequest.findOne({ _id: id, doctorId });
        if (!request) return res.status(404).json({ success: false, error: 'Request not found' });
        if (request.status !== 'pending') {
            return res.status(400).json({ success: false, error: `Request is already ${request.status}` });
        }

        request.status = 'rejected';
        request.doctorResponse = doctorResponse || '';
        request.updatedAt = new Date();
        await request.save();

        await notificationService.sendEmergencyRejection(request.patientId, doctorResponse);

        res.json({ success: true, data: request, message: 'Emergency request rejected' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
