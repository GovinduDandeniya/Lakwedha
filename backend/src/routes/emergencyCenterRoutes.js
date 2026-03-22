const express = require('express');
const router = express.Router();
const {
    getEmergencyTypes,
    getAllCenters,
    getNearbyCenters,
    getCenterById,
    createCenter,
} = require('../controllers/emergencyCenterController');

// Public endpoints
router.get('/types', getEmergencyTypes);
router.get('/', getAllCenters);
router.get('/nearby', getNearbyCenters);
router.get('/:id', getCenterById);

// Admin endpoint
router.post('/', createCenter);

module.exports = router;
