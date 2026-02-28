const EMR = require('../models/EMR');
const { encrypt, decrypt } = require('../utils/encryption');

/**
 * Controller to create an EMR Record (Doctor Only)
 */
exports.createEMR = async (req, res) => {
    try {
        const { patientId, notes, diagnosis } = req.body;

        if (!patientId || !notes || !diagnosis) {
            return res.status(400).json({ message: 'patientId, notes and diagnosis are required.' });
        }

        const doctorId = req.user.id || req.user._id;

        const newEMR = new EMR({
            patientId,
            doctorId,
            encryptedNotes: encrypt(notes),
            diagnosis
        });

        await newEMR.save();

        res.status(201).json({
            message: 'EMR created successfully',
            emr: newEMR
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create EMR', error: error.message });
    }
};

/**
 * Controller to get EMR records for a Patient (Patient Only)
 */
exports.getPatientEMR = async (req, res) => {
    try {
        const patientId = req.user.id || req.user._id;

        const emrs = await EMR.find({ patientId }).populate('doctorId', 'name email').sort({ createdAt: -1 });

        const decryptedEMRs = emrs.map(record => {
            const emrObj = record.toObject();
            if (emrObj.encryptedNotes) {
                try {
                    emrObj.notes = decrypt(emrObj.encryptedNotes);
                } catch (err) {
                    emrObj.notes = '[Decryption Failed]';
                }
                delete emrObj.encryptedNotes;
            }
            return emrObj;
        });

        res.status(200).json({
            message: 'EMRs retrieved successfully',
            emrs: decryptedEMRs
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch EMR', error: error.message });
    }
};
