const Hospital = require('../models/Hospital');

/* ── Public ── */

/** GET /api/hospitals — list active hospitals (for doctors to pick from) */
exports.getActiveHospitals = async (req, res) => {
    try {
        const hospitals = await Hospital.find({ isActive: true }).sort({ name: 1 });
        res.json(hospitals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ── Admin ── */

/** GET /api/admin/hospitals — list all hospitals */
exports.getAllHospitals = async (req, res) => {
    try {
        const hospitals = await Hospital.find().sort({ name: 1 });
        res.json(hospitals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/** POST /api/admin/hospitals — create a hospital */
exports.createHospital = async (req, res) => {
    try {
        const { name, location, city, type, adminCharge } = req.body;
        if (!name?.trim() || !location?.trim()) {
            return res.status(400).json({ message: 'name and location are required' });
        }
        const hospital = await Hospital.create({
            name: name.trim(),
            location: location.trim(),
            city: city?.trim() || '',
            type: type || 'hospital',
            contactNumber: req.body.contactNumber?.trim() || '',
            adminCharge: Number(adminCharge) || 0,
        });
        res.status(201).json(hospital);
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ message: 'Hospital already exists' });
        res.status(500).json({ error: err.message });
    }
};

/** PUT /api/admin/hospitals/:id — update hospital (name, location, adminCharge, etc.) */
exports.updateHospital = async (req, res) => {
    try {
        const { name, location, city, type, contactNumber, adminCharge, isActive } = req.body;
        const update = {};
        if (name          !== undefined) update.name          = name.trim();
        if (location      !== undefined) update.location      = location.trim();
        if (city          !== undefined) update.city          = city.trim();
        if (type          !== undefined) update.type          = type;
        if (contactNumber !== undefined) update.contactNumber = contactNumber.trim();
        if (adminCharge   !== undefined) update.adminCharge   = Number(adminCharge);
        if (isActive      !== undefined) update.isActive      = Boolean(isActive);

        const hospital = await Hospital.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
        res.json(hospital);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/** DELETE /api/admin/hospitals/:id — delete a hospital */
exports.deleteHospital = async (req, res) => {
    try {
        const hospital = await Hospital.findByIdAndDelete(req.params.id);
        if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
        res.json({ message: 'Hospital deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
