const express = require('express');
const router = express.Router();

// Import routes
const availabilityRoutes = require('./routes/availability.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const clinicRoutes = require('./routes/clinic.routes');

// Register routes
router.use('/availability', availabilityRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/clinic', clinicRoutes);

module.exports = router;