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
    confirmPayment,
    handlePayhereNotification
} = require('../controllers/orderController');

// PayHere server-to-server webhook (defined before /:id)
router.post('/pay/notify', handlePayhereNotification);

// GET all orders - Protected
router.get('/', auth, getAllOrders);

// Create order from prescription - Protected
router.post('/from-prescription/:prescriptionId', auth, createOrderFromPrescription);

// GET single order - Protected
router.get('/:id', auth, getOrderById);

// Update payment status (Pharmacist / Admin) - Protected
router.put('/:id/payment', auth, updatePaymentStatus);

// Update order status (lifecycle) - Protected
router.put('/:id/status', auth, updateOrderStatus);

// Initiate Payment - Protected
router.post('/:id/pay/initiate', auth, initiatePayment);

// Confirm Payment - Protected
router.post('/:id/pay/confirm', auth, confirmPayment);

module.exports = router;
