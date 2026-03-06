const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');

// Public routes
router.get('/', doctorController.searchDoctors);
router.get('/:doctorId', doctorController.getDoctorById);

module.exports = router;
