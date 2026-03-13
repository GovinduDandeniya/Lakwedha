const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescription.controller');
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/roleMiddleware');
const upload = require('../middleware/upload.middleware');

// Post a Prescription (Doctor only) handles file attachments under 'file' name
router.post('/', auth, authorizeRoles('DOCTOR', 'doctor'), upload.single('file'), prescriptionController.createPrescription);

// Get Prescriptions (Doctor fetching for a patient or Patient fetching their own)
router.get('/', auth, authorizeRoles('PATIENT', 'patient', 'DOCTOR', 'doctor'), prescriptionController.getPrescriptions);

// Safely Retrieve Uploaded Prescription file
router.get('/files/:filename', auth, authorizeRoles('PATIENT', 'patient', 'DOCTOR', 'doctor'), prescriptionController.getPrescriptionFile);

module.exports = router;
