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
 * Controller to get Prescriptions for a Patient (Patient Only)
 */
exports.getPatientPrescriptions = async (req, res) => {
    try {
        const patientId = req.user.id || req.user._id;

        const prescriptions = await Prescription.find({ patientId })
            .populate('doctorId', 'name email')
            .sort({ issuedDate: -1 });

        res.status(200).json({
            message: 'Prescriptions retrieved successfully',
            prescriptions
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch Prescriptions', error: error.message });
    }
};
