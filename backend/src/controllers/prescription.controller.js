const Prescription = require('../models/Prescription');

/**
 * Controller to create a Prescription (Doctor Only)
 */
exports.createPrescription = async (req, res) => {
    try {
        const { patientId, medications, notes, fileUrl } = req.body;

        if (!patientId || !medications || !Array.isArray(medications) || medications.length === 0) {
            return res.status(400).json({ message: 'patientId and at least one medication are required.' });
        }

        const doctorId = req.user.id || req.user._id;

        const newPrescription = new Prescription({
            patientId,
            doctorId,
            medications,
            notes,
            fileUrl,
        });

        await newPrescription.save();

        res.status(201).json({
            message: 'Prescription created successfully',
            prescription: newPrescription
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create Prescription', error: error.message });
    }
};

/**
 * Controller to get Prescriptions
 */
exports.getPrescriptions = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const userRole = (req.user.role || '').toUpperCase();

        let query = {};

        if (userRole === 'PATIENT') {
            query.patientId = userId;
        } else if (userRole === 'DOCTOR') {
            const { patientId } = req.query;
            if (patientId) {
                query.patientId = patientId;
            }
            query.doctorId = userId;
        } else {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const prescriptions = await Prescription.find(query)
            .populate('doctorId', 'name email')
            .populate('patientId', 'name email')
            .sort({ issuedDate: -1 });

        res.status(200).json({
            message: 'Prescriptions retrieved successfully',
            prescriptions
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch Prescriptions', error: error.message });
    }
};
