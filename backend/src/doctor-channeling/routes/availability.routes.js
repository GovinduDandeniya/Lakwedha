const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/availability.controller');
const { authMiddleware, roleMiddleware } = require('../../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// Doctor routes
router.post('/',
    roleMiddleware(['doctor']),
    availabilityController.createAvailability
);

router.get('/my',
    roleMiddleware(['doctor']),
    availabilityController.getAvailability
);

router.patch('/slot/:slotId',
    roleMiddleware(['doctor']),
    availabilityController.updateSlot
);

router.delete('/:availabilityId',
    roleMiddleware(['doctor']),
    availabilityController.deleteAvailability
);

// Public routes (for patients)
router.get('/doctor/:doctorId',
    availabilityController.getAvailability
);

module.exports = router;