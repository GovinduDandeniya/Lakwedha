const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescription.controller');
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/roleMiddleware');

// Post a Prescription (Doctor only)
router.post('/', auth, authorizeRoles('DOCTOR', 'doctor'), prescriptionController.createPrescription);

// Get Patient's own Prescriptions (Patient only)
router.get('/my-prescriptions', auth, authorizeRoles('PATIENT', 'patient'), prescriptionController.getPatientPrescriptions);

module.exports = router;
