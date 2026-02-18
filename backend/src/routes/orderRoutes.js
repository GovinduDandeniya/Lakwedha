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

// Initiate payment (get gateway params) - Protected
router.get('/:id/pay', auth, (req, res, next) => {
    const { id } = req.params;
    // Controller logic will go here
    res.json({ message: 'Gateway integration ready', orderId: id });
});

module.exports = router;
