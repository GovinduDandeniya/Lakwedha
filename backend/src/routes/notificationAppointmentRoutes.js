/**
 * Notification Appointment Routes
 * Defines Express router paths for booking appointments and triggering notifications.
 */

const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/notificationAppointmentController');

// @route   POST /api/v1/notification/appointments
// @desc    Book an appointment and trigger SMS/Email confirmations
// @access  Public (for demonstration)
router.post('/appointments', appointmentController.bookAppointment);

module.exports = router;
