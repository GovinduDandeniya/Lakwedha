const express = require('express');
const router = express.Router();
const emrController = require('../controllers/emr.controller');
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/roleMiddleware');

// Post an EMR record (Doctor only)
router.post('/', auth, authorizeRoles('DOCTOR', 'doctor'), emrController.createEMR);

// Get EMR records (Doctor fetching for a patient or Patient fetching their own)
router.get('/', auth, authorizeRoles('PATIENT', 'patient', 'DOCTOR', 'doctor'), emrController.getEMRs);

const memoryUpload = require('../middleware/memoryUpload.middleware');
router.post('/upload', auth, authorizeRoles('DOCTOR', 'doctor'), memoryUpload.single('file'), emrController.uploadEMRRecord);
router.get('/patient/:id', auth, authorizeRoles('PATIENT', 'patient', 'DOCTOR', 'doctor'), emrController.getEMRsByPatientId);
router.get('/files/:filename', auth, authorizeRoles('PATIENT', 'patient', 'DOCTOR', 'doctor'), emrController.getEMRFile);

module.exports = router;
