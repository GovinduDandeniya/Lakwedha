const express = require('express');
const router = express.Router();
const emrController = require('../controllers/emr.controller');
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/roleMiddleware');

// Post an EMR record (Doctor only)
router.post('/', auth, authorizeRoles('DOCTOR', 'doctor'), emrController.createEMR);

// Get Patient's own EMR records (Patient only)
router.get('/my-records', auth, authorizeRoles('PATIENT', 'patient'), emrController.getPatientEMR);

module.exports = router;
