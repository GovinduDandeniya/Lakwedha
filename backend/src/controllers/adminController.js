const User = require('../models/user');
const RegisteredDoctor = require('../models/RegisteredDoctor');
const Order = require('../models/Order');
const Appointment = require('../doctor-channeling/models/appointment.model');
const ChannelingSession = require('../doctor-channeling/models/channelingSession.model');

/* ──────────────────────────── DOCTORS ──────────────────────────── */

/** GET /api/admin/doctors — list all registered doctors with optional status filter */
exports.getDoctors = async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) filter.status = req.query.status.toUpperCase();

        const doctors = await RegisteredDoctor.find(filter)
            .select('-password -fcmToken')
            .sort({ createdAt: -1 });
        res.json(doctors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/** PUT /api/admin/doctors/:id/approve */
exports.approveDoctor = async (req, res) => {
    try {
        const doctor = await RegisteredDoctor.findByIdAndUpdate(
            req.params.id,
            { status: 'APPROVED' },
            { new: true }
        ).select('-password -fcmToken');
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
        res.json({ message: 'Doctor approved', doctor });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/** PUT /api/admin/doctors/:id/reject */
exports.rejectDoctor = async (req, res) => {
    try {
        const doctor = await RegisteredDoctor.findByIdAndUpdate(
            req.params.id,
            { status: 'DECLINED', declineReason: req.body.reason || null },
            { new: true }
        ).select('-password -fcmToken');
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
        res.json({ message: 'Doctor declined', doctor });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ──────────────────────────── PHARMACIES ──────────────────────────── */

/** GET /api/admin/pharmacies — list all pharmacy accounts */
exports.getPharmacies = async (req, res) => {
    try {
        const filter = { role: 'pharmacy' };
        if (req.query.status) filter.status = req.query.status;

        const pharmacies = await User.find(filter).sort({ createdAt: -1 });
        res.json(pharmacies);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/** PUT /api/admin/pharmacies/:id/approve */
exports.approvePharmacy = async (req, res) => {
    try {
        const pharmacy = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'pharmacy' },
            { status: 'active' },
            { new: true }
        );
        if (!pharmacy) return res.status(404).json({ message: 'Pharmacy not found' });
        res.json({ message: 'Pharmacy approved', pharmacy });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/** PUT /api/admin/pharmacies/:id/reject */
exports.rejectPharmacy = async (req, res) => {
    try {
        const pharmacy = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'pharmacy' },
            { status: 'rejected' },
            { new: true }
        );
        if (!pharmacy) return res.status(404).json({ message: 'Pharmacy not found' });
        res.json({ message: 'Pharmacy rejected', pharmacy });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ──────────────────────────── PATIENTS / USERS ──────────────────────────── */

/** GET /api/admin/patients — list all patients */
exports.getPatients = async (req, res) => {
    try {
        // Exclude all non-patient roles (case-insensitive to catch 'DOCTOR', 'doctor', etc.)
        const filter = { role: { $regex: /^user$/i } };
        if (req.query.status) filter.status = req.query.status;

        const patients = await User.find(filter).sort({ createdAt: -1 });
        res.json(patients);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/** PUT /api/admin/users/:id/suspend */
exports.suspendUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { status: 'suspended' },
            { new: true }
        );
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User suspended', user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/** DELETE /api/admin/users/:id — permanently delete a patient account */
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findOneAndDelete({ _id: req.params.id, role: { $regex: /^user$/i } });
        if (!user) return res.status(404).json({ message: 'Patient not found' });
        res.json({ message: 'Patient account deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/** PUT /api/admin/users/:id/activate */
exports.activateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { status: 'active' },
            { new: true }
        );
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User activated', user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ──────────────────────────── APPOINTMENTS ──────────────────────────── */

/**
 * PUT /api/admin/appointments/:id/cancel
 * Admin cancels an appointment on patient's request (via phone call).
 * If payment was already made: deducts 10% cancellation fee and marks as refunded.
 */
exports.cancelAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('doctorId', 'name consultationFee');

        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
        if (appointment.status === 'cancelled') {
            return res.status(400).json({ message: 'Appointment is already cancelled' });
        }

        const reason = req.body.reason || 'Cancelled by admin on patient request';

        let cancellationFee = 0;
        let refundAmount    = 0;
        let totalAmount     = 0;

        if (appointment.paymentStatus === 'paid') {
            const doctorFee       = appointment.doctorId?.consultationFee || 1500;
            const hospitalCharge  = 500;
            const channelingCharge = 300;
            totalAmount     = doctorFee + hospitalCharge + channelingCharge;
            cancellationFee = Math.round(totalAmount * 0.10);
            refundAmount    = totalAmount - cancellationFee;

            appointment.paymentStatus   = 'refunded';
            appointment.cancellationFee = cancellationFee;
        }

        appointment.status             = 'cancelled';
        appointment.cancellationReason = reason;
        appointment.updatedAt          = new Date();
        await appointment.save();

        res.json({
            message: 'Appointment cancelled',
            cancellationFee,
            refundAmount,
            totalAmount,
            appointment,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/** GET /api/admin/appointments — list all channeling appointments */
exports.getAppointments = async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;

        const appointments = await Appointment.find(filter)
            .populate('patientId', 'name email phone first_name last_name')
            .populate('doctorId', 'name specialization')
            .sort({ slotTime: -1 });

        res.json(appointments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/** GET /api/admin/channeling-sessions — list all channeling sessions released by doctors */
exports.getChannelingSessions = async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.date) {
            const d = new Date(req.query.date);
            filter.date = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
        }

        const sessions = await ChannelingSession.find(filter)
            .populate('doctorId', 'name specialization')
            .sort({ date: -1, startTime: 1 });

        res.json(sessions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ──────────────────────────── ORDERS ──────────────────────────── */

/** GET /api/admin/orders — list all orders */
exports.getOrders = async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;

        const orders = await Order.find(filter)
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ──────────────────────────── ANALYTICS / DASHBOARD ──────────────────────────── */

/** GET /api/admin/analytics/overview — dashboard KPI numbers */
exports.getAnalyticsOverview = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const [
            totalPatients,
            activeDoctors,
            pendingDoctors,
            totalPharmacies,
            pendingPharmacies,
            totalOrders,
            patientsThisMonth,
            patientsLastMonth,
        ] = await Promise.all([
            User.countDocuments({ role: 'user' }),
            User.countDocuments({ role: 'doctor', status: 'active' }),
            User.countDocuments({ role: 'doctor', status: 'pending' }),
            User.countDocuments({ role: 'pharmacy' }),
            User.countDocuments({ role: 'pharmacy', status: 'pending' }),
            Order.countDocuments(),
            User.countDocuments({ role: 'user', createdAt: { $gte: startOfMonth } }),
            User.countDocuments({
                role: 'user',
                createdAt: { $gte: startOfLastMonth, $lt: startOfMonth },
            }),
        ]);

        // Revenue
        const revenueResult = await Order.aggregate([
            { $match: { paymentStatus: 'paid' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        const monthlyRevenueResult = await Order.aggregate([
            { $match: { paymentStatus: 'paid', createdAt: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]);
        const monthlyRevenue = monthlyRevenueResult.length > 0 ? monthlyRevenueResult[0].total : 0;

        // Appointment count from channeling system
        const totalAppointments = await Appointment.countDocuments();
        const appointmentsThisMonth = await Appointment.countDocuments({
            createdAt: { $gte: startOfMonth },
        });

        const patientGrowth =
            patientsLastMonth > 0
                ? (((patientsThisMonth - patientsLastMonth) / patientsLastMonth) * 100).toFixed(1)
                : patientsThisMonth > 0
                  ? '100.0'
                  : '0.0';

        res.json({
            totalPatients,
            activeDoctors,
            pendingDoctors,
            totalPharmacies,
            pendingPharmacies,
            totalOrders,
            totalAppointments,
            appointmentsThisMonth,
            totalRevenue,
            monthlyRevenue,
            patientsThisMonth,
            patientGrowth: `${patientGrowth}%`,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
