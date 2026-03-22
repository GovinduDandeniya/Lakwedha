const express = require('express');
const router = express.Router();
const hospital = require('../controllers/hospitalController');

// Public — active hospitals list (used by doctor portal to populate dropdown)
router.get('/', hospital.getActiveHospitals);

module.exports = router;
