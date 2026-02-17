const Order = require('../models/Order');
const Prescription = require('../models/Prescription');
const { DELIVERY_FEE, TAX_RATE, ORDER_STATUS, PAYMENT_STATUS, PRESCRIPTION_STATUS } = require('../config/constants');
const { updateOrderStatusSchema, updatePaymentStatusSchema } = require('../utils/validationSchemas');

// Create order from prescription
exports.createOrderFromPrescription = async (req, res, next) => {
    try {
        const { prescriptionId } = req.params;
        const { totalAmount } = req.body; // Accept calculated total if provided, or use prescription data
        console.log(`Initialising order for prescription ${prescriptionId}`);

        const prescription = await Prescription.findById(prescriptionId);
        if (!prescription) {
            return res.status(404).json({ message: 'Prescription context missing.' });
        }

        if (prescription.pharmacyStatus !== PRESCRIPTION_STATUS.APPROVED) {
            return res.status(400).json({ message: 'Verification Required: Pharmacy must approve prescription first.' });
        }

        // Create order using direct financial data
        const order = await Order.create({
            userId: prescription.userId,
            prescriptionId: prescription._id,
            medicines: prescription.medicines,
            totalAmount: Number(totalAmount || 0), // Trusted FE value
            status: ORDER_STATUS.APPROVED,
            paymentStatus: PAYMENT_STATUS.PENDING
        });

        console.log(`Order created: ${order._id}`);
        res.status(201).json({ message: 'Order created successfully', order });
    } catch (err) {
        next(err);
    }
};

// Update order status
exports.updateOrderStatus = async (req, res, next) => {
    try {
        const { error } = updateOrderStatusSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { id } = req.params;
        const { status } = req.body;

        console.log(`Updating status for order ${id} to ${status}`);

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.status = status;
        await order.save();

        console.log(`Order ${id} status updated`);
        res.json({ message: 'Order status updated', order });
    } catch (err) {
        next(err);
    }
};

// Update payment status
exports.updatePaymentStatus = async (req, res, next) => {
    try {
        const { error } = updatePaymentStatusSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { id } = req.params;
        const { paymentStatus } = req.body;

        console.log(`Updating payment status for order ${id} to ${paymentStatus}`);

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.paymentStatus = paymentStatus;
        await order.save();

        console.log(`Order ${id} payment status updated`);
        res.json({ message: 'Payment status updated', order });
    } catch (err) {
        next(err);
    }
};

// GET all orders
exports.getAllOrders = async (req, res, next) => {
    try {
        console.log('Fetching all orders');
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        next(err);
    }
};

// GET single order by ID
exports.getOrderById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (err) {
        next(err);
    }
};
