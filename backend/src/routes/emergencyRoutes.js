const express = require('express');
const router = express.Router();
const emergency = require('../controllers/emergencyController');

// Public routes — used by mobile app
router.get('/', emergency.getNearbyCenters);
router.get('/:id', emergency.getCenterById);

module.exports = router;
