const express = require('express');
const router = express.Router();
const clinicController = require('../controllers/clinic.controller');
const { authMiddleware, roleMiddleware } = require('../../middleware/auth.middleware');

// Public routes
router.get('/nearby', clinicController.getNearbyClinics);
router.get('/:doctorId', clinicController.getClinic);

// Protected routes
router.use(authMiddleware);

router.post('/',
    roleMiddleware(['doctor']),
    clinicController.upsertClinic
);

module.exports = router;