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
