const express = require('express');
const {
  registerPharmacy,
  loginPharmacy,
  approvePharmacy,
  rejectPharmacy,
  getAllPharmacies,
} = require('../controllers/pharmacyRegistrationController');

const router = express.Router();

// Public
router.post('/register', registerPharmacy);
router.post('/login', loginPharmacy);

// Admin
router.get('/all', getAllPharmacies);
router.put('/approve/:id', approvePharmacy);
router.put('/reject/:id', rejectPharmacy);

module.exports = router;
