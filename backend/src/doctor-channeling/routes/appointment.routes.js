const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const { authMiddleware, roleMiddleware } = require('../../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// Patient routes
router.post('/book',
    roleMiddleware(['patient']),
    appointmentController.bookAppointment
);

router.get('/history',
    appointmentController.getHistory
);

router.get('/queue/:slotId',
    appointmentController.getQueueStatus
);

// Get single appointment
router.get('/:appointmentId',
    appointmentController.getAppointmentById
);

// Doctor and Patient routes
router.patch('/:appointmentId/status',
    appointmentController.updateStatus
);

module.exports = router;