const Order = require('../models/Order');
const Prescription = require('../models/Prescription');
const Medicine = require('../models/Medicine');
const { PRESCRIPTION_STATUS } = require('../config/constants');
const { updateOrderStatusSchema, updatePaymentStatusSchema } = require('../utils/validationSchemas');
const asyncHandler = require('../utils/asyncHandler');
const { OrderStateMachine, ORDER_STATUSES } = require('../utils/orderStateMachine');
const PaymentService = require('../utils/PaymentService');

// Create order from prescription (Manually invoked fallback)
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

// Update order status (State transitions, inventory, and history)
exports.updateOrderStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body;

    const order = await Order.findById(id);
    if (!order) {
        return res.status(404).json({ success: false, data: null, message: 'Order not found' });
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

// Update payment status
exports.updatePaymentStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    const order = await Order.findById(id);
    if (!order) {
        return res.status(404).json({ success: false, data: null, message: 'Order not found' });
    }

    order.paymentStatus = paymentStatus;
    await order.save();

    res.json({ success: true, data: order, message: 'Payment status updated securely' });
});

// GET all orders
exports.getAllOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, data: orders, message: 'Orders retrieved' });
});

// GET single order by ID
exports.getOrderById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) return res.status(404).json({ success: false, data: null, message: 'Order not found' });

    res.json({ success: true, data: order, message: 'Order retrieved' });
});

// POST /api/orders/:id/pay/initiate
// Verify the order, check it is in a payable state, generate PayHere params and signature
exports.initiatePayment = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const order = await Order.findById(id).populate('userId', 'firstName lastName email phone');
    if (!order) {
        return res.status(404).json({ success: false, data: null, message: 'Order not found' });
    }

    // Order must belong to the requesting user
    const requestingUserId = req.user ? req.user.id : null;
    if (!requestingUserId || order.userId._id.toString() !== requestingUserId.toString()) {
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

    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    const isSandbox = process.env.PAYHERE_SANDBOX === 'true';

    if (!merchantId || !merchantSecret) {
        return res.status(500).json({ success: false, data: null, message: 'Payment gateway not configured on server.' });
    }

    const amount = parseFloat(order.totalAmount).toFixed(2);
    const currency = 'LKR';

    const hash = PaymentService.generateSignature(merchantId, order._id.toString(), amount, currency, merchantSecret);

    const payhereParams = {
        sandbox: isSandbox,
        merchant_id: merchantId,
        return_url: '',   // Not used for mobile SDK — callbacks are handled natively
        cancel_url: '',
        notify_url: `${process.env.BACKEND_BASE_URL}/api/orders/pay/notify`,
        order_id: order._id.toString(),
        items: `Lakwedha Order #${order._id.toString().slice(-6)}`,
        amount: amount,
        currency: currency,
        hash: hash,
        first_name: order.userId.firstName || 'Customer',
        last_name: order.userId.lastName || '',
        email: order.userId.email || '',
        phone: order.userId.phone || '',
        address: 'N/A',
        city: 'Colombo',
        country: 'Sri Lanka',
    };

    res.json({ success: true, data: payhereParams, message: 'Payment parameters generated' });
});

// POST /api/orders/pay/notify
// PayHere webhook — verify signature, update payment and order status
exports.handlePayhereNotification = asyncHandler(async (req, res) => {
    const { order_id, status_code } = req.body;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

    // Always respond 200 to PayHere immediately, then process
    res.status(200).send('OK');

    try {
        const isValid = PaymentService.verifyNotification(req.body, merchantSecret);
        if (!isValid) {
            console.error('[PayHere Webhook] Invalid signature — possible spoofed notification. OrderId:', order_id);
            return;
        }

        const order = await Order.findById(order_id);
        if (!order) {
            console.error('[PayHere Webhook] Order not found for id:', order_id);
            return;
        }

        // status_code 2 = Success, -1 = Cancelled, -2 = Failed, -3 = Chargebacked
        if (status_code === '2') {
            order.paymentStatus = 'paid';
            order.statusHistory.push({
                from: order.status,
                to: ORDER_STATUSES.PROCESSING,
                changedAt: new Date(),
                changedBy: 'payhere_webhook',
                reason: 'Payment confirmed by PayHere gateway'
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
        } else {
            order.paymentStatus = 'failed';
            order.statusHistory.push({
                from: order.status,
                to: order.status,
                changedAt: new Date(),
                changedBy: 'payhere_webhook',
                reason: `Payment failed — PayHere status code: ${status_code}`
            });
        }

        await order.save();
        console.log('[PayHere Webhook] Order', order_id, 'updated. Payment status:', order.paymentStatus);
    } catch (err) {
        console.error('[PayHere Webhook] Error processing notification:', err.message);
    }
});
