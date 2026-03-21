const EMR = require('../models/EMR');
const { encrypt, decrypt } = require('../utils/encryption');
const logger = require('../utils/logger');

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

const { createEMRSchema } = require('../utils/validationSchemas');

/**
 * Controller to create an EMR Record (Doctor Only)
 */
exports.createEMR = async (req, res) => {
    try {
        const { error } = createEMRSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { patientId, notes, diagnosis, treatment } = req.body;

        const doctorId = req.user.id || req.user._id;

        const newEMR = new EMR({
            patientId,
            doctorId,
            encryptedNotes: encrypt(notes),
            encryptedDiagnosis: encrypt(diagnosis),
            encryptedTreatment: encrypt(treatment)
        });

        await newEMR.save();

        logger.info(`EMR created successfully for patient ${patientId} by doctor ${doctorId}`);

        res.status(201).json({
            message: 'EMR created successfully',
            emr: decryptEMR(newEMR)
        });
    } catch (error) {
        logger.error(`Failed to create EMR: ${error.message}`);
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

        logger.info(`EMRs retrieved safely for user ${userId}`);

        res.status(200).json({
            message: 'EMRs retrieved successfully',
            emrs: decryptedEMRs
        });
    } catch (error) {
        logger.error(`Failed to fetch EMR: ${error.message}`);
        res.status(500).json({ message: 'Failed to fetch EMR', error: error.message });
    }
};

/**
 * Handle new AES Uploads
 */
exports.uploadEMRRecord = async (req, res) => {
    try {
        const { patientId, type, title, diagnosis, notes } = req.body;
        const doctorId = req.user.id;

        if (!patientId || !type) {
            return res.status(400).json({ error: 'patientId and type are strictly required.' });
        }

        let fileUrl = '';

        // Use memory buffer from multer to encrypt on the fly!
        if (req.file) {
            const fs = require('fs');
            const path = require('path');
            const crypto = require('crypto');

            const rawBuffer = req.file.buffer;

            // Generate deterministic IV for symmetric file blob storage
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(process.env.AES_SECRET_KEY, 'utf-8'), iv);
            let encryptedBuffer = Buffer.concat([iv, cipher.update(rawBuffer), cipher.final()]);

            const uploadDir = path.join(__dirname, '../../uploads/emr');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filename = `emr-${Date.now()}-${Math.floor(Math.random() * 1000000000)}.${req.file.originalname.split('.').pop()}`;
            const filePath = path.join(uploadDir, filename);

            fs.writeFileSync(filePath, encryptedBuffer);
            fileUrl = `/api/emr/files/${filename}`;
        }

        const emrPayload = {
            patientId,
            doctorId,
            type,
            title: title || 'Patient Vault Upload',
            fileUrl,   // Saves the encrypted relative route!
            encryptedDiagnosis: diagnosis ? encrypt(diagnosis) : undefined,
            encryptedNotes: notes ? encrypt(notes) : undefined,
            createdAt: new Date().toISOString()
        };

        const newEmr = new EMR(emrPayload);
        const record = await newEmr.save();

        res.status(201).json({ message: 'High-Sec Record Uploaded.', record });
    } catch (err) {
        logger.error(`Upload error: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
};

/**
 * Fetch patient specifically directly 
 */
exports.getEMRsByPatientId = async (req, res) => {
    try {
        const emrs = await EMR.find({ patientId: req.params.id })
            .populate('doctorId', 'name email')
            .sort({ createdAt: -1 });

        const decryptedEMRs = emrs.map(decryptEMR);
        res.status(200).json(decryptedEMRs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * High-Security File Decryption Streamer!
 */
exports.getEMRFile = (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const crypto = require('crypto');

        const filename = req.params.filename;
        const filePath = path.join(__dirname, '../../uploads/emr', filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Vault file missing entirely.' });
        }

        const encryptedData = fs.readFileSync(filePath);
        const iv = encryptedData.slice(0, 16);
        const content = encryptedData.slice(16);

        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(process.env.AES_SECRET_KEY, 'utf-8'), iv);
        let decrypted = Buffer.concat([decipher.update(content), decipher.final()]);

        // Guess mime type roughly from extension
        let ext = filename.split('.').pop().toLowerCase();
        let mime = 'application/octet-stream';
        if (['jpg', 'jpeg'].includes(ext)) mime = 'image/jpeg';
        else if (ext === 'png') mime = 'image/png';
        else if (ext === 'pdf') mime = 'application/pdf';
        else if (ext === 'txt') mime = 'text/plain';

        res.setHeader('Content-Type', mime);
        res.send(decrypted);
    } catch (err) {
        logger.error(`Decrypt Stream Error: ${err.message}`);
        res.status(500).json({ error: 'Decryption failed locally.' });
    }
};
