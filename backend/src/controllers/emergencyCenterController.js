const EmergencyCenter = require('../models/EmergencyCenter');

// GET /api/emergency-centers
const getAllCenters = async (req, res) => {
    try {
        const centers = await EmergencyCenter.find({ isActive: true }).sort({ name: 1 });
        res.json({ data: centers });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch emergency centers' });
    }
};

// GET /api/emergency-centers/nearby?lat=...&lng=...&radius=...
const getNearbyCenters = async (req, res) => {
    try {
        const { lat, lng, radius } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ message: 'lat and lng are required' });
        }

        const radiusKm = parseFloat(radius) || 50;
        const centers = await EmergencyCenter.find({
            isActive: true,
            location: {
                $nearSphere: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)],
                    },
                    $maxDistance: radiusKm * 1000,
                },
            },
        });

        res.json({ data: centers });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch nearby centers' });
    }
};

// GET /api/emergency-centers/:id
const getCenterById = async (req, res) => {
    try {
        const center = await EmergencyCenter.findById(req.params.id);
        if (!center) {
            return res.status(404).json({ message: 'Center not found' });
        }
        res.json({ data: center });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch center' });
    }
};

// POST /api/emergency-centers (admin)
const createCenter = async (req, res) => {
    try {
        const { name, type, address, phone, latitude, longitude, is24Hours } = req.body;
        const center = await EmergencyCenter.create({
            name,
            type,
            address,
            phone,
            location: { type: 'Point', coordinates: [longitude, latitude] },
            is24Hours: is24Hours || false,
        });
        res.status(201).json({ data: center });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

module.exports = { getAllCenters, getNearbyCenters, getCenterById, createCenter };
