const EmergencyCenter = require('../models/EmergencyCenter');

const EMERGENCY_TYPES = [
    'Snake Bite',
    'Fractures (Hand / Leg Broken)',
    'Joint Dislocation',
    'Burn Injuries',
    'Wounds & Cuts',
    'Poisoning (Herbal First Aid)',
    'Fever & Infection',
    'Allergic Reactions',
    'Insect Bites & Stings',
    'Muscle Sprain / Ligament Injury',
    'Paralysis (Initial Care)',
    'Head Injury (Mild)',
    'Skin Diseases (Severe)',
    'Digestive Emergencies',
    'Respiratory Distress (Asthma)',
];

// GET /api/emergency-centers/types
const getEmergencyTypes = (req, res) => {
    res.json({ success: true, data: EMERGENCY_TYPES });
};

// GET /api/emergency-centers?emergencyType=...
const getAllCenters = async (req, res) => {
    try {
        const { emergencyType } = req.query;
        const filter = { isActive: true };
        if (emergencyType) {
            filter.emergencyTypes = emergencyType;
        }
        const centers = await EmergencyCenter.find(filter).sort({ name: 1 });
        res.json({ data: centers });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch emergency centers' });
    }
};

// Sri Lanka bounding box
const SL_LAT_MIN = 5.9, SL_LAT_MAX = 9.9;
const SL_LNG_MIN = 79.5, SL_LNG_MAX = 82.0;

// GET /api/emergency-centers/nearby?lat=...&lng=...&radius=...&emergencyType=...
const getNearbyCenters = async (req, res) => {
    try {
        const { lat, lng, radius, emergencyType } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ message: 'lat and lng are required' });
        }

        const parsedLat = parseFloat(lat);
        const parsedLng = parseFloat(lng);

        // Reject coordinates clearly outside Sri Lanka
        if (
            parsedLat < SL_LAT_MIN || parsedLat > SL_LAT_MAX ||
            parsedLng < SL_LNG_MIN || parsedLng > SL_LNG_MAX
        ) {
            return res.status(400).json({ message: 'Coordinates are outside Sri Lanka' });
        }

        const radiusKm = parseFloat(radius) || 7; // default 7 km
        const filter = {
            isActive: true,
            country: 'Sri Lanka',
            location: {
                $nearSphere: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parsedLng, parsedLat],
                    },
                    $maxDistance: radiusKm * 1000,
                },
            },
        };
        if (emergencyType) {
            filter.emergencyTypes = emergencyType;
        }

        const centers = await EmergencyCenter.find(filter);
        res.json({ data: centers, radiusKm });
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
        const { name, type, address, phone, latitude, longitude, is24Hours, emergencyTypes } = req.body;
        const center = await EmergencyCenter.create({
            name,
            type,
            address,
            phone,
            location: { type: 'Point', coordinates: [longitude, latitude] },
            emergencyTypes: emergencyTypes || [],
            is24Hours: is24Hours || false,
        });
        res.status(201).json({ data: center });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

module.exports = { getEmergencyTypes, getAllCenters, getNearbyCenters, getCenterById, createCenter };
