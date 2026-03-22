/**
 * Notification Appointment Routes
 * POST /api/v1/notification/appointments — Book appointment and trigger SMS/Email confirmations
 */

const express = require('express');
const router = express.Router();
const { bookAppointment } = require('../controllers/notificationAppointmentController');

router.post('/appointments', bookAppointment);

module.exports = router;
