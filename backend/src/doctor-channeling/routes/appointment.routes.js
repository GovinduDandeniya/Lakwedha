const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const { authMiddleware, roleMiddleware } = require('../../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// ── Extra appointment request routes ─────────────────────────────────────────
// Doctor: get all extra requests for their sessions
router.get('/extra-requests',
    roleMiddleware(['doctor']),
    appointmentController.getExtraRequests
);

// Doctor: respond (accept/reject) to a specific extra request
router.patch('/extra-requests/:id/respond',
    roleMiddleware(['doctor']),
    appointmentController.respondToExtraRequest
);

// Patient: submit an extra appointment request for a full session
router.post('/extra-requests',
    roleMiddleware(['patient']),
    appointmentController.submitExtraRequest
);

// ── Standard appointment routes ───────────────────────────────────────────────
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