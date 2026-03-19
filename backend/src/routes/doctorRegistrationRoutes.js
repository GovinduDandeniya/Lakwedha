const express = require('express');
const {
  registerDoctor,
  getApprovedDoctors,
  getPendingDoctors,
  approveDoctor,
  declineDoctor,
} = require('../controllers/doctorRegistrationController');

const router = express.Router();

// Public: mobile app fetches approved doctors
router.get('/', getApprovedDoctors);

// Doctor registration
router.post('/register', registerDoctor);

// Admin: list pending registrations
router.get('/pending', getPendingDoctors);

// Admin: approve or decline a doctor
router.put('/approve/:id', approveDoctor);
router.put('/decline/:id', declineDoctor);

module.exports = router;
