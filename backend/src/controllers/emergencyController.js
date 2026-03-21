const EmergencyCenter = require('../models/EmergencyCenter');

/** GET /api/emergency-centers?lat=...&lng=...&maxDistance=... */
exports.getNearbyCenters = async (req, res) => {
    try {
        const { lat, lng, maxDistance = 10000 } = req.query; // maxDistance in meters, default 10km

        if (!lat || !lng) {
            // If no coordinates provided, return all active centers
            const centers = await EmergencyCenter.find({ isActive: true }).sort({ name: 1 });
            return res.json(centers);
        }

        const centers = await EmergencyCenter.find({
            isActive: true,
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)],
                    },
                    $maxDistance: parseInt(maxDistance),
                },
            },
        });

        res.json(centers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/** GET /api/emergency-centers/:id */
exports.getCenterById = async (req, res) => {
    try {
        const center = await EmergencyCenter.findById(req.params.id);
        if (!center) return res.status(404).json({ message: 'Center not found' });
        res.json(center);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/** POST /api/admin/emergency-centers — admin creates a center */
exports.createCenter = async (req, res) => {
    try {
        const center = await EmergencyCenter.create(req.body);
        res.status(201).json(center);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/** PUT /api/admin/emergency-centers/:id */
exports.updateCenter = async (req, res) => {
    try {
        const center = await EmergencyCenter.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        if (!center) return res.status(404).json({ message: 'Center not found' });
        res.json(center);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/** DELETE /api/admin/emergency-centers/:id */
exports.deleteCenter = async (req, res) => {
    try {
        const center = await EmergencyCenter.findByIdAndDelete(req.params.id);
        if (!center) return res.status(404).json({ message: 'Center not found' });
        res.json({ message: 'Center deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
