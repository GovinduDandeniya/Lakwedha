const Order = require('../models/Order');
const Prescription = require('../models/Prescription');
const Medicine = require('../models/Medicine');

const asyncHandler = require('../utils/asyncHandler');
const { OrderStateMachine, ORDER_STATUSES } = require('../utils/orderStateMachine');
const PaymentService = require('../utils/PaymentService');

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

    // Price was already calculated and stored on the prescription when the pharmacy approved it
    const order = await Order.create({
        userId: prescription.userId,
        prescriptionId: prescription._id,
        pharmacyId: prescription.pharmacyId, // Added for audit/security queries
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

    // Role Security: Only Pharmacists assigned to this order or Admin can change status
    const isPharmacy = order.pharmacyId && order.pharmacyId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isPharmacy && !isAdmin) {
        return res.status(403).json({ success: false, data: null, message: 'Restricted Action: Only the fulfilling pharmacist can update order status.' });
    }

    const currentStatus = order.status;

    // Enforce explicit forward-only state machine transitions
    try {
        OrderStateMachine.assertValidTransition(currentStatus, status);
    } catch (error) {
        return res.status(400).json({ success: false, data: null, message: error.message });
    }

    order.status = status;

    // Push explicitly required history object
    order.statusHistory.push({
        from: currentStatus,
        to: status,
        changedAt: new Date(),
        changedBy: req.user ? req.user.id : null,
        reason: reason || 'Status updated automatically'
    });

    // Handle Inventory Decrements / Restorations
    if (status === ORDER_STATUSES.PROCESSING) {
        for (const med of order.medicines) {
            await Medicine.updateOne(
                { name: med.name },
                { $inc: { stockQuantity: -med.quantity } }
            );
        }
    } else if (status === ORDER_STATUSES.CANCELLED) {
        // If it was already processing or past, restore stock
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

    res.json({ success: true, data: order, message: `Order transitioned securely from ${currentStatus} to ${status}` });
});

// Update the payment status of an order (Admin only)
exports.updatePaymentStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    // Security check: only admin can force-update payment status
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, data: null, message: 'Only administrators can manually update payment status records.' });
    }

    const order = await Order.findById(id);
    if (!order) {
        return res.status(404).json({ success: false, data: null, message: 'Order not found' });
    }

    order.paymentStatus = paymentStatus;
    await order.save();

    res.json({ success: true, data: order, message: 'Payment status updated securely' });
});

// Retrieve orders (Filtered by role: Users see theirs, Pharmacists see theirs)
exports.getAllOrders = asyncHandler(async (req, res) => {
    let query = {};

    // Privacy Logic: Filter by role
    if (req.user.role === 'pharmacist') {
        query = { pharmacyId: req.user.id };
    } else if (req.user.role === 'user') {
        query = { userId: req.user.id };
    }
    // Admin? Query stays empty to see all

    const orders = await Order.find(query)
        .populate('prescriptionId')
        .sort({ createdAt: -1 });

    res.json({ success: true, data: orders, message: 'Orders retrieved' });
});

// Retrieve a single order with ownership check
exports.getOrderById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const order = await Order.findById(id).populate('prescriptionId');

    if (!order) {
        return res.status(404).json({ success: false, data: null, message: 'Order not found' });
    }

    // Security Assertion: Ensure requesting user has relationship to this order
    const isOwner = order.userId.toString() === req.user.id.toString();
    const isPharmacy = order.pharmacyId && order.pharmacyId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isPharmacy && !isAdmin) {
        return res.status(403).json({ success: false, data: null, message: 'Unauthorized access to this order record.' });
    }

    res.json({ success: true, data: order, message: 'Order retrieved' });
});

// Initiate a Stripe payment for an approved order
exports.initiatePayment = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const order = await Order.findById(id).populate('userId', 'name email');
    if (!order) {
        return res.status(404).json({ success: false, data: null, message: 'Order not found' });
    }

    // Order must belong to the requesting user or user must have admin privileges
    const requestingUserId = req.user ? req.user.id : null;
    const isAdmin = req.user && req.user.role === 'admin';
    if (!isAdmin && (!requestingUserId || order.userId._id.toString() !== requestingUserId.toString())) {
        return res.status(403).json({ success: false, data: null, message: 'You do not have permission to pay for this order' });
    }

    // Only orders in APPROVED state can be paid — they are awaiting payment
    if (order.status !== ORDER_STATUSES.APPROVED) {
        return res.status(400).json({
            success: false,
            data: null,
            message: `Order is in '${order.status}' state and cannot be paid. Only approved orders awaiting payment can be initiated.`
        });
    }

    if (order.paymentStatus === 'paid') {
        return res.status(400).json({ success: false, data: null, message: 'This order has already been paid.' });
    }

    try {
        const amount = parseFloat(order.totalAmount).toFixed(2);
        const currency = 'LKR';

        // Creates a Checkout Session and returns the browser URL to Stripe's hosted gateway
        const session = await PaymentService.createCheckoutSession(amount, currency, order._id.toString());

        res.json({
            success: true,
            data: {
                paymentUrl: session.url,
                sessionId: session.id,
                amount: amount,
                currency: currency
            },
            message: 'Stripe Checkout Session created successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, data: null, message: error.message });
    }
});

// Handle Stripe webhook notification for payment status updates
exports.handleStripeWebhook = asyncHandler(async (req, res) => {
    // Note: In Express, Stripe webhooks require raw body access because it validates the raw symmetric signature.
    // If you use express.json() globally, you might need a raw body middleware for this specific route.
    const sig = req.headers['stripe-signature'];

    let event;
    try {
        event = PaymentService.verifyWebhook(req.rawBody || JSON.stringify(req.body), sig);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Acknowledge receipt of the event
    res.status(200).send('OK');

    try {
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            const order_id = paymentIntent.metadata.orderId;

            const order = await Order.findById(order_id);
            if (!order) return;

            // IDEMPOTENCY CHECK: Prevent duplicate processing if Stripe sends webhook twice
            if (order.paymentStatus === 'paid') {
                return;
            }

            order.paymentStatus = 'paid';
            order.statusHistory.push({
                from: order.status,
                to: ORDER_STATUSES.PROCESSING,
                changedAt: new Date(),
                changedBy: 'stripe_webhook',
                reason: 'Payment confirmed by Stripe gateway'
            });

            OrderStateMachine.assertValidTransition(order.status, ORDER_STATUSES.PROCESSING);
            order.status = ORDER_STATUSES.PROCESSING;

            // Decrement inventory
            for (const med of order.medicines) {
                await Medicine.updateOne(
                    { name: med.name },
                    { $inc: { stockQuantity: -med.quantity } }
                );
            }
            await order.save();
        } else if (event.type === 'payment_intent.payment_failed') {
            const paymentIntent = event.data.object;
            const order_id = paymentIntent.metadata.orderId;

            const order = await Order.findById(order_id);
            if (!order) return;

            order.paymentStatus = 'failed';
            order.statusHistory.push({
                from: order.status,
                to: order.status,
                changedAt: new Date(),
                changedBy: 'stripe_webhook',
                reason: `Payment failed — Stripe declined`
            });
            await order.save();
        }
    } catch (err) {
        // Silently catch webhook processing errors
    }
});
