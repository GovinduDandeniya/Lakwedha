const ClinicLocation = require('../models/clinicLocation.model');

/**
 * Add/Update clinic location
 * POST /api/v1/doctor-channeling/clinic
 */
exports.upsertClinic = async (req, res) => {
    try {
        const clinicData = {
            doctorId: req.user.id,
            ...req.body,
            updatedAt: new Date()
        };

        const clinic = await ClinicLocation.findOneAndUpdate(
            { doctorId: req.user.id },
            clinicData,
            { new: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            data: clinic,
            message: 'Clinic location saved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Get clinic location by doctor ID
 * GET /api/v1/doctor-channeling/clinic/:doctorId
 */
exports.getClinic = async (req, res) => {
    try {
        const { doctorId } = req.params;

        const clinic = await ClinicLocation.findOne({ doctorId });

        if (!clinic) {
            return res.status(404).json({
                success: false,
                error: 'Clinic location not found'
            });
        }

        res.status(200).json({
            success: true,
            data: clinic
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Get nearby clinics
 * GET /api/v1/doctor-channeling/clinic/nearby?lat=&lng=&radius=
 */
exports.getNearbyClinics = async (req, res) => {
    try {
        const { lat, lng, radius = 10 } = req.query; // radius in km

        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                error: 'Latitude and longitude are required'
            });
        }

        const clinics = await ClinicLocation.find({
            coordinates: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: radius * 1000 // Convert to meters
                }
            },
            isVerified: true
        }).populate('doctorId', 'name specialization');

        res.status(200).json({
            success: true,
            data: clinics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};