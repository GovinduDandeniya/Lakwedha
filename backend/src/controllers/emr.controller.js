const EMR = require('../models/EMR');
const { encrypt, decrypt } = require('../utils/encryption');

/**
 * Helper to decrypt an EMR record safely
 */
const decryptEMR = (record) => {
    const emrObj = record.toObject();

    // Decrypt fields
    const fieldsToDecrypt = [
        { encrypted: 'encryptedNotes', plain: 'notes' },
        { encrypted: 'encryptedDiagnosis', plain: 'diagnosis' },
        { encrypted: 'encryptedTreatment', plain: 'treatment' }
    ];

    fieldsToDecrypt.forEach(({ encrypted, plain }) => {
        if (emrObj[encrypted]) {
            try {
                emrObj[plain] = decrypt(emrObj[encrypted]);
            } catch (err) {
                emrObj[plain] = '[Decryption Failed]';
            }
            delete emrObj[encrypted];
        }
    });

    return emrObj;
};

/**
 * Controller to create an EMR Record (Doctor Only)
 */
exports.createEMR = async (req, res) => {
    try {
        const { patientId, notes, diagnosis, treatment } = req.body;

        if (!patientId || !notes || !diagnosis || !treatment) {
            return res.status(400).json({ message: 'patientId, notes, diagnosis, and treatment are required.' });
        }

        const doctorId = req.user.id || req.user._id;

        const newEMR = new EMR({
            patientId,
            doctorId,
            encryptedNotes: encrypt(notes),
            encryptedDiagnosis: encrypt(diagnosis),
            encryptedTreatment: encrypt(treatment)
        });

        await newEMR.save();

        res.status(201).json({
            message: 'EMR created successfully',
            emr: decryptEMR(newEMR)
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create EMR', error: error.message });
    }
};

/**
 * Controller to get EMR records (Patient viewing own, or Doctor viewing patient)
 */
exports.getEMRs = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const userRole = (req.user.role || '').toUpperCase();

        let query = {};

        if (userRole === 'PATIENT') {
            query.patientId = userId; // Patient can only view their own
        } else if (userRole === 'DOCTOR') {
            const { patientId } = req.query; // Doctor must provide patientId or we get all for this doctor
            if (patientId) {
                query.patientId = patientId;
            }
            query.doctorId = userId; // Doctor can only view EMRs they created
        } else {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const emrs = await EMR.find(query)
            .populate('doctorId', 'name email')
            .populate('patientId', 'name email')
            .sort({ createdAt: -1 });

        const decryptedEMRs = emrs.map(decryptEMR);

        res.status(200).json({
            message: 'EMRs retrieved successfully',
            emrs: decryptedEMRs
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch EMR', error: error.message });
    }
};
