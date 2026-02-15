const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getAllPrescriptions,
    reviewPrescription,
    updatePrescriptionMedicines,
} = require('../controllers/pharmacyController');

// GET all prescriptions - Protected
router.get('/prescriptions', auth, getAllPrescriptions);

// Review prescription (approve/reject) - Protected
router.put('/prescriptions/:id/review', auth, reviewPrescription);

// Update medicines for a prescription - Protected
router.put('/prescriptions/:id/medicines', auth, updatePrescriptionMedicines);

module.exports = router;
