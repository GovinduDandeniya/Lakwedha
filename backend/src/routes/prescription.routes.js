const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescription.controller');
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/roleMiddleware');

// Post a Prescription (Doctor only)
router.post('/', auth, authorizeRoles('DOCTOR', 'doctor'), prescriptionController.createPrescription);

// Get Prescriptions (Doctor fetching for a patient or Patient fetching their own)
router.get('/', auth, authorizeRoles('PATIENT', 'patient', 'DOCTOR', 'doctor'), prescriptionController.getPrescriptions);

module.exports = router;
