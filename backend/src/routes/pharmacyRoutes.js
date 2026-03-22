const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getAllPrescriptions,
    reviewPrescription,
    updatePrescriptionMedicines,
    uploadPrescription,
    getNearbyPharmacies,
    getPharmacyStats,
} = require('../controllers/pharmacyController');

// GET nearby pharmacies - Protected
router.get('/nearby', auth, getNearbyPharmacies);

// POST upload prescription - Protected
router.post('/prescriptions', auth, uploadPrescription);

// GET all prescriptions - Protected
router.get('/prescriptions', auth, getAllPrescriptions);

// GET Dashboard stats - Protected
router.get('/stats', auth, getPharmacyStats);


// Review prescription (approve/reject) - Protected
router.put('/prescriptions/:id/review', auth, reviewPrescription);

// Update medicines for a prescription - Protected
router.put('/prescriptions/:id/medicines', auth, updatePrescriptionMedicines);

module.exports = router;
