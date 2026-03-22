const express = require('express');
const {
  registerPharmacy,
  loginPharmacy,
  approvePharmacy,
  rejectPharmacy,
  getAllPharmacies,
} = require('../controllers/pharmacyRegistrationController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// Public
router.post('/register', registerPharmacy);
router.post('/login', loginPharmacy);

// Admin only
router.get('/all', authMiddleware, roleMiddleware(['admin']), getAllPharmacies);
router.put('/approve/:id', authMiddleware, roleMiddleware(['admin']), approvePharmacy);
router.put('/reject/:id', authMiddleware, roleMiddleware(['admin']), rejectPharmacy);

module.exports = router;
