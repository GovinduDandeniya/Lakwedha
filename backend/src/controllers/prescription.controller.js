const Prescription = require('../models/Prescription');
const { createPrescriptionSchema } = require('../utils/validationSchemas');

/**
 * Controller to create a Prescription (Doctor Only)
 */
exports.createPrescription = async (req, res) => {
    try {
        // Validate request body
        const { error } = createPrescriptionSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        let { patientId, medications, notes } = req.body;

        // Handle medications which might be stringified JSON when sent via FormData
        if (typeof medications === 'string') {
            try {
                medications = JSON.parse(medications);
            } catch (err) {
                return res.status(400).json({ message: 'Invalid format for medications array.' });
            }
        }

        if (!patientId || !medications || !Array.isArray(medications) || medications.length === 0) {
            return res.status(400).json({ message: 'patientId and at least one medication are required.' });
        }

        const doctorId = req.user.id || req.user._id;

        // Check for uploaded file
        const fileUrl = req.file ? `/uploads/${req.file.filename}` : req.body.fileUrl || null;

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
            prescription: newPrescription,
            fileUrl // Return file URL explicitly as requested
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create Prescription', error: error.message });
    }
};


