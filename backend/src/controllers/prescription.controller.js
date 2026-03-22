const Prescription = require('../models/Prescription');
const { createPrescriptionSchema } = require('../utils/validationSchemas');
const logger = require('../utils/logger');
const path = require('path');

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

        // Payload contains safely parsed medications structure from Joi validator mapping
        const { patientId, medications, notes } = req.body;

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

        logger.info(`Prescription created for patient ${patientId} by doctor ${doctorId}`);

        res.status(201).json({
            message: 'Prescription created successfully',
            prescription: newPrescription,
            fileUrl // Return file URL explicitly as requested
        });
    } catch (error) {
        logger.error(`Failed to create Prescription: ${error.message}`);
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

        logger.info(`Prescriptions retrieved successfully for user ${userId}`);

        res.status(200).json({
            message: 'Prescriptions retrieved successfully',
            prescriptions
        });
    } catch (error) {
        logger.error(`Failed to fetch Prescriptions: ${error.message}`);
        res.status(500).json({ message: 'Failed to fetch Prescriptions', error: error.message });
    }
};

/**
 * Controller to securely fetch a Prescription attached file by its generic string
 */
exports.getPrescriptionFile = (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(__dirname, '../../uploads', filename);

        res.sendFile(filePath, (err) => {
            if (err) {
                logger.error(`File retrieval failed for ${filename}: ${err.message}`);
                // Don't leak directory existence/trace errors natively, just cleanly return 404.
                res.status(404).json({ message: 'File not found or unreadable.' });
            }
        });
    } catch (error) {
        logger.error(`Secure File Fetch Crash: ${error.message}`);
        res.status(500).json({ message: 'Internal error accessing file.' });
    }
};
