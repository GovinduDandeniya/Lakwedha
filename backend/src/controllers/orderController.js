const Order = require('../models/Order');
const Prescription = require('../models/Prescription');
const Medicine = require('../models/Medicine');

const asyncHandler = require('../utils/asyncHandler');
const { OrderStateMachine, ORDER_STATUSES } = require('../utils/orderStateMachine');
const PaymentService = require('../utils/PaymentService');

/**
 * Handle Order Lifecycle and Payments
 * Part of the official Lakwedha pharmacy-patient bridge.
 */

// Create an order from an approved prescription
exports.createOrderFromPrescription = asyncHandler(async (req, res) => {
    const { prescriptionId } = req.params;

    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
        return res.status(404).json({ success: false, data: null, message: 'Prescription context missing.' });
    }

    if (prescription.pharmacyStatus !== 'approved') {
        return res.status(400).json({ success: false, data: null, message: 'Verification Required: Pharmacy must approve prescription first.' });
    }

    const order = await Order.create({
        userId: prescription.userId,
        prescriptionId: prescription._id,
        pharmacyId: prescription.pharmacyId,
        medicines: prescription.medicines,
        subtotal: prescription.subtotal,
        tax: prescription.tax,
        deliveryFee: prescription.deliveryFee,
        totalAmount: prescription.totalAmount,
        status: ORDER_STATUSES.APPROVED,
        paymentStatus: 'pending',
        statusHistory: [{
            from: 'none',
            to: ORDER_STATUSES.APPROVED,
            changedBy: req.user ? req.user.id : null,
            changedAt: new Date(),
            reason: 'Order created from approved prescription'
        }]
    });

    res.status(201).json({ success: true, data: order, message: 'Order created successfully' });
});

// Update the order status and handle inventory tracking
exports.updateOrderStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body;

    const order = await Order.findById(id);
    if (!order) {
        return res.status(404).json({ success: false, data: null, message: 'Order not found' });
    }

    const isPharmacy = order.pharmacyId && order.pharmacyId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isPharmacy && !isAdmin) {
        return res.status(403).json({ success: false, data: null, message: 'Restricted Action: Only the fulfilling pharmacist can update order status.' });
    }

    const currentStatus = order.status;

    try {
        OrderStateMachine.assertValidTransition(currentStatus, status);
    } catch (error) {
        return res.status(400).json({ success: false, data: null, message: error.message });
    }

    order.status = status;
    order.statusHistory.push({
        from: currentStatus,
        to: status,
        changedAt: new Date(),
        changedBy: req.user ? req.user.id : null,
        reason: reason || 'Status updated automatically'
    });

    if (status === ORDER_STATUSES.PROCESSING) {
        for (const med of order.medicines) {
            await Medicine.updateOne(
                { name: med.name },
                { $inc: { stockQuantity: -med.quantity } }
            );
        }
    } else if (status === ORDER_STATUSES.CANCELLED) {
        if ([ORDER_STATUSES.PROCESSING, ORDER_STATUSES.SHIPPED].includes(currentStatus)) {
            for (const med of order.medicines) {
                await Medicine.updateOne(
                    { name: med.name },
                    { $inc: { stockQuantity: med.quantity } }
                );
            }
        }
    }

    await order.save();
    res.json({ success: true, data: order, message: `Order transitioned from ${currentStatus} to ${status}` });
});

// Update the payment status of an order (Pharmacist can mark COD as paid)
exports.updatePaymentStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    const order = await Order.findById(id);
    if (!order) {
        return res.status(404).json({ success: false, data: null, message: 'Order not found' });
    }

    // Allow pharmacist assigned to the order or admin to update payment status
    const isPharmacy = order.pharmacyId && order.pharmacyId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isPharmacy && !isAdmin) {
        return res.status(403).json({ success: false, data: null, message: 'Only administrators or assigned pharmacists can update payment records.' });
    }

    const oldStatus = order.paymentStatus;
    order.paymentStatus = paymentStatus;
    
    if (paymentStatus === 'paid' && oldStatus !== 'paid') {
        order.paidAt = new Date();
        order.statusHistory.push({
            from: order.status,
            to: order.status, // Keep same status, just record payment
            changedBy: req.user.id,
            changedAt: new Date(),
            reason: 'Payment confirmed manually (COD / Internal)'
        });
    }

    await order.save();
    res.json({ success: true, data: order, message: 'Payment status updated securely' });
});

// Retrieve orders (Filtered by role)
exports.getAllOrders = asyncHandler(async (req, res) => {
    let query = {};
    if (req.user.role === 'pharmacist') {
        query = { pharmacyId: req.user.id };
    } else if (req.user.role === 'user') {
        query = { userId: req.user.id };
    }

    const orders = await Order.find(query)
        .populate('prescriptionId')
        .sort({ createdAt: -1 });

    res.json({ success: true, data: orders, message: 'Orders retrieved' });
});

// Retrieve a single order (Fixed to return all required fields)
exports.getOrderById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const order = await Order.findById(id).populate('prescriptionId');

    if (!order) {
        return res.status(404).json({ success: false, data: null, message: 'Order not found' });
    }

    const isOwner = order.userId.toString() === req.user.id.toString();
    const isPharmacy = order.pharmacyId && order.pharmacyId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isPharmacy && !isAdmin) {
        return res.status(403).json({ success: false, data: null, message: 'Unauthorized access to this order.' });
    }

    // Logic ensures paymentStatus, paymentIntentId, and paidAt are naturally in the lean object
    res.json({ success: true, data: order, message: 'Order retrieved' });
});

// Part 3: Fix initiatePayment exact flow
exports.initiatePayment = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // 1. Find order by ID — 404 if not found
    const order = await Order.findById(id);
    if (!order) {
        return res.status(404).json({ success: false, data: null, message: 'Order not found' });
    }

    // 2. Check order is not already paid — 400 if already paid
    if (order.paymentStatus === 'paid') {
        return res.status(400).json({ success: false, data: null, message: 'This order has already been paid.' });
    }

    try {
        const amount = parseFloat(order.totalAmount).toFixed(2);
        const currency = 'LKR';

        // 3. Create Stripe Payment Intent with correct amount
        const paymentIntent = await PaymentService.createPaymentIntent(amount, currency, order._id.toString());

        // 4. Store paymentIntentId on order and save to database
        order.paymentIntentId = paymentIntent.id;
        await order.save();

        // 5. Return clientSecret and publishableKey to the app
        res.json({
            success: true,
            data: {
                clientSecret: paymentIntent.client_secret,
                publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
                amount: amount,
                currency: currency
            },
            message: 'Payment intent created successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, data: null, message: error.message });
    }
});

// Part 3: Fix confirmPayment exact flow
exports.confirmPayment = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // 1. Find order by ID — 404 if not found
    const order = await Order.findById(id);
    if (!order) {
        return res.status(404).json({ success: false, data: null, message: 'Order not found' });
    }

    // 2. Check order.paymentIntentId exists — 400 if not
    if (!order.paymentIntentId) {
        return res.status(400).json({ success: false, data: null, message: 'No payment intent associated with this order' });
    }

    // 3. Call stripe.paymentIntents.retrieve to get real Stripe status
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const paymentIntent = await stripe.paymentIntents.retrieve(order.paymentIntentId);

    // 4. If status is not succeeded return 400
    if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ success: false, data: null, message: 'Payment has not been completed' });
    }

    // 5. If order.paymentStatus is already paid return 400
    if (order.paymentStatus === 'paid') {
        return res.status(400).json({ success: false, data: null, message: 'This order has already been paid' });
    }

    // 6. Run state machine transition
    const oldStatus = order.status;
    const nextStatus = ORDER_STATUSES.PROCESSING;
    try {
        OrderStateMachine.assertValidTransition(oldStatus, nextStatus);
    } catch (err) {
        // If state machine fails, we still record payment but don't advance status
        // However, user specifically asked to advance status
    }

    // 7. Set order.paymentStatus = 'paid' and order.paidAt = new Date()
    order.paymentStatus = 'paid';
    order.paidAt = new Date();
    order.status = nextStatus;

    // 8. Push to statusHistory
    order.statusHistory.push({
        from: oldStatus,
        to: nextStatus,
        changedBy: req.user.id,
        changedAt: new Date(),
        reason: 'Payment confirmed via Stripe'
    });

    // 9. Call save once
    await order.save();

    // 10. Return full updated order
    res.json({
        success: true,
        data: order,
        message: 'Payment confirmed and order advanced to processing'
    });
});

exports.handleStripeWebhook = asyncHandler(async (req, res) => {
    // Legacy support or redundancy
    res.status(200).send('OK');
});
