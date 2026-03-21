const User = require('../models/user');
const Order = require('../models/Order');
const Prescription = require('../models/Prescription');

/* ──────────────────────────── DOCTORS ──────────────────────────── */

/** GET /api/admin/doctors — list all doctors with optional status filter */
exports.getDoctors = async (req, res) => {
    try {
        const filter = { role: 'doctor' };
        if (req.query.status) filter.status = req.query.status;

        const doctors = await User.find(filter).sort({ createdAt: -1 });
        res.json(doctors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/** PUT /api/admin/doctors/:id/approve */
exports.approveDoctor = async (req, res) => {
    try {
        const doctor = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'doctor' },
            { status: 'active' },
            { new: true }
        );
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
        res.json({ message: 'Doctor approved', doctor });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/** PUT /api/admin/doctors/:id/reject */
exports.rejectDoctor = async (req, res) => {
    try {
        const doctor = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'doctor' },
            { status: 'rejected' },
            { new: true }
        );
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
        res.json({ message: 'Doctor rejected', doctor });
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
        const filter = { role: 'user' };
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
 * GET /api/admin/appointments
 * Reads from Avishka's Appointment model when available.
 * Returns empty array gracefully if model doesn't exist yet.
 */
exports.getAppointments = async (req, res) => {
    try {
        let Appointment;
        try {
            Appointment = require('../models/Appointment');
        } catch {
            return res.json([]);
        }

        const filter = {};
        if (req.query.status) filter.status = req.query.status;

        const appointments = await Appointment.find(filter)
            .populate('patientId', 'name email phone')
            .populate('doctorId', 'name specialty')
            .sort({ createdAt: -1 });

        res.json(appointments);
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

        // Appointment count (graceful if model doesn't exist yet)
        let totalAppointments = 0;
        let appointmentsThisMonth = 0;
        try {
            const Appointment = require('../models/Appointment');
            totalAppointments = await Appointment.countDocuments();
            appointmentsThisMonth = await Appointment.countDocuments({
                createdAt: { $gte: startOfMonth },
            });
        } catch {
            // Model not yet created by Avishka
        }

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
