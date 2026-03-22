const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    createOrderFromPrescription,
    updatePaymentStatus,
    updateOrderStatus,
} = require('../controllers/orderController');

// Create order from prescription - Protected
router.post('/from-prescription/:prescriptionId', auth, createOrderFromPrescription);

// Update payment status - Protected
router.put('/:id/payment', auth, updatePaymentStatus);

// Update order status (lifecycle) - Protected
router.put('/:id/status', auth, updateOrderStatus);

module.exports = router;
