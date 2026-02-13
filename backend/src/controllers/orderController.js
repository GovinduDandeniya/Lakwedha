const Order = require('../models/Order');
const Prescription = require('../models/Prescription');
const { DELIVERY_FEE, TAX_RATE, ORDER_STATUS, PAYMENT_STATUS, PRESCRIPTION_STATUS } = require('../config/constants');

// Create order from prescription
exports.createOrderFromPrescription = async (req, res) => {
    try {
        const { prescriptionId } = req.params;
        console.log(`Creating order from prescription ${prescriptionId}`);

        const prescription = await Prescription.findById(prescriptionId);
        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        // Check if pharmacy approved
        if (prescription.pharmacyStatus !== PRESCRIPTION_STATUS.APPROVED) {
            return res.status(400).json({ message: 'Prescription must be approved by pharmacy first.' });
        }

        // Calculate totals
        const subtotal = prescription.medicines.reduce((sum, med) => sum + (med.price * med.quantity), 0);

        // Ensure there is a subtotal (unless free medicines are allowed, but usually not)
        if (subtotal === 0 && prescription.medicines.length === 0) {
             return res.status(400).json({ message: 'Cannot create order with no medicines/price.' });
        }

        const deliveryFee = DELIVERY_FEE;
        const tax = subtotal * TAX_RATE;
        const totalAmount = subtotal + deliveryFee + tax;

        const order = await Order.create({
            userId: prescription.userId,
            prescriptionId: prescription._id,
            medicines: prescription.medicines,
            subtotal,
            deliveryFee,
            tax,
            totalAmount,
            status: ORDER_STATUS.APPROVED, // Set to approved as per requirement
            paymentStatus: PAYMENT_STATUS.PENDING
        });

        console.log(`Order created: ${order._id}`);
        res.status(201).json({ message: 'Order created successfully', order });
    } catch (err) {
        console.error('Error creating order:', err);
        res.status(500).json({ message: 'Server error creating order' });
    }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        console.log(`Updating status for order ${id} to ${status}`);

        if (!Object.values(ORDER_STATUS).includes(status)) {
            return res.status(400).json({ message: 'Invalid order status' });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.status = status;
        await order.save(); // timestamps enabled, so updatedAt triggers automatically

        console.log(`Order ${id} status updated`);
        res.json({ message: 'Order status updated', order });
    } catch (err) {
        console.error(`Error updating order status ${req.params.id}:`, err);
        res.status(500).json({ message: 'Server error updating order status' });
    }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentStatus } = req.body;

        console.log(`Updating payment status for order ${id} to ${paymentStatus}`);

        if (!Object.values(PAYMENT_STATUS).includes(paymentStatus)) {
            return res.status(400).json({ message: 'Invalid payment status' });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.paymentStatus = paymentStatus;
        await order.save();

        console.log(`Order ${id} payment status updated`);
        res.json({ message: 'Payment status updated', order });
    } catch (err) {
        console.error(`Error updating payment status ${req.params.id}:`, err);
        res.status(500).json({ message: 'Server error updating payment status' });
    }
};
