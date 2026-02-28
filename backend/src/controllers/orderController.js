const Order = require('../models/Order');
const Prescription = require('../models/Prescription');
const Medicine = require('../models/Medicine');
const { PRESCRIPTION_STATUS } = require('../config/constants');
const { updateOrderStatusSchema, updatePaymentStatusSchema } = require('../utils/validationSchemas');
const asyncHandler = require('../utils/asyncHandler');
const PriceCalculationService = require('../services/PriceCalculationService');
const { OrderStateMachine, ORDER_STATUSES } = require('../utils/orderStateMachine');

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

    // Force secure server-side price calculation
    const pricing = PriceCalculationService.calculateTotal(prescription.medicines);

    const order = await Order.create({
        userId: prescription.userId,
        prescriptionId: prescription._id,
        medicines: prescription.medicines,
        subtotal: pricing.subtotal,
        tax: pricing.tax,
        deliveryFee: pricing.deliveryFee,
        totalAmount: pricing.totalAmount,
        status: ORDER_STATUSES.APPROVED,
        paymentStatus: 'pending',
        statusHistory: [{
            from: 'none',
            to: ORDER_STATUSES.APPROVED,
            reason: 'Order created securely from prescription'
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
        changedBy: req.user ? req.user.id : null, // Added tracking of who changed it
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

// STUB: Real price check endpoint for mobile checkout
exports.calculateOrderPrice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) return res.status(404).json({ success: false, data: null, message: 'Order not found' });

    res.json({
        success: true,
        data: {
            subtotal: order.subtotal,
            tax: order.tax,
            deliveryFee: order.deliveryFee,
            totalAmount: order.totalAmount,
            currency: 'LKR'
        },
        message: 'Accurate server-pricing retrieved'
    });
});
