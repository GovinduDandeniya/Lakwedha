const User = require('../models/user');

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
