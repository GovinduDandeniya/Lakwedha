const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    createOrderFromPrescription,
    updatePaymentStatus,
    updateOrderStatus,
    getAllOrders,
    getOrderById,
    initiatePayment,
    handleStripeWebhook
} = require('../controllers/orderController');

// GET all orders - Protected
router.get('/', auth, getAllOrders);

// GET single order - Protected
router.get('/:id', auth, getOrderById);

// Create order from prescription - Protected
router.post('/from-prescription/:prescriptionId', auth, createOrderFromPrescription);

// Update payment status - Protected
router.put('/:id/payment', auth, updatePaymentStatus);

// Update order status (lifecycle) - Protected
router.put('/:id/status', auth, updateOrderStatus);

// Initiate PayHere payment — returns hash and all params for mobile SDK - Protected
router.post('/:id/pay/initiate', auth, initiatePayment);

// Stripe server-to-server webhook — no auth, signature verified internally via rawBody
router.post('/pay/notify', handleStripeWebhook);

module.exports = router;
