const Order = require('../models/Order');
const Prescription = require('../models/Prescription');
const Medicine = require('../models/Medicine');
const User = require('../models/user');
const crypto = require('crypto');

const asyncHandler = require('../utils/asyncHandler');
const { OrderStateMachine, ORDER_STATUSES } = require('../utils/orderStateMachine');

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

    // Calculate financials from prescription medicines as fallback for older records
    let { subtotal, tax, deliveryFee, totalAmount } = prescription;
    if (!totalAmount) {
        const DELIVERY_FEE = parseFloat(process.env.PHARMACY_DELIVERY_FEE) || 350;
        const TAX_RATE = parseFloat(process.env.PHARMACY_TAX_RATE) || 0.05;
        subtotal = prescription.medicines.reduce((sum, item) => sum + Number(item.quantity) * Number(item.price), 0);
        tax = subtotal * TAX_RATE;
        deliveryFee = DELIVERY_FEE;
        totalAmount = subtotal + tax + deliveryFee;
    }

    const order = await Order.create({
        userId: prescription.userId,
        prescriptionId: prescription._id,
        pharmacyId: prescription.pharmacyId,
        medicines: prescription.medicines,
        subtotal,
        tax,
        deliveryFee,
        totalAmount,
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

    // Manual payment confirmation is only valid for COD orders
    if (order.paymentMethod !== 'cod') {
        return res.status(400).json({ success: false, data: null, message: 'Manual payment confirmation is only allowed for Cash on Delivery orders.' });
    }

    // Only allow transitioning to paid or failed; not re-opening a paid order
    const allowedStatuses = ['paid', 'failed'];
    if (!allowedStatuses.includes(paymentStatus)) {
        return res.status(400).json({ success: false, data: null, message: `Invalid payment status. Allowed values: ${allowedStatuses.join(', ')}.` });
    }

    if (order.paymentStatus === 'paid') {
        return res.status(400).json({ success: false, data: null, message: 'This order has already been marked as paid.' });
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
  if (req.user.role === 'pharmacist' || req.user.role === 'pharmacy') {
        query = { pharmacyId: req.user.id };
  } else if (req.user.role === 'user' || req.user.role === 'patient') {
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

exports.initiatePayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  if (order.paymentStatus === 'paid') {
    return res.status(400).json({ success: false, message: 'This order has already been paid' });
  }

  if (!process.env.PAYHERE_MERCHANT_ID || !process.env.PAYHERE_MERCHANT_SECRET) {
    return res.status(500).json({ success: false, message: 'PayHere credentials not configured' });
  }

  const merchantId = process.env.PAYHERE_MERCHANT_ID.trim();
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET.trim();
  const orderId = order._id.toString();
  const amount = order.totalAmount.toFixed(2);
  const currency = 'LKR';

  const user = await User.findById(req.user.id).select('first_name last_name email phone');

  // Generate hash exactly as PayHere docs specify
  const hashedSecret = crypto
    .createHash('md5')
    .update(merchantSecret)
    .digest('hex')
    .toUpperCase();

  const hash = crypto
    .createHash('md5')
    .update(merchantId + orderId + amount + currency + hashedSecret)
    .digest('hex')
    .toUpperCase();

  res.json({
    success: true,
    data: {
      sandbox: process.env.PAYHERE_SANDBOX?.trim() === 'true',
      merchant_id: merchantId,
      return_url: `${process.env.BACKEND_URL?.trim()}/api/v1/orders/pay/return`,
      cancel_url: `${process.env.BACKEND_URL?.trim()}/api/v1/orders/pay/cancel`,
      notify_url: `${process.env.BACKEND_URL?.trim()}/api/v1/orders/pay/notify`,
      order_id: orderId,
      items: 'Ayurvedic Medicines',
      amount: amount,
      currency: currency,
      hash: hash,
      first_name: user?.first_name || 'Patient',
      last_name: user?.last_name || '',
      email: user?.email || 'patient@lakwedha.com',
      phone: user?.phone || '0771234567',
      address: 'Sri Lanka',
      city: 'Colombo',
      country: 'Sri Lanka'
    },
    message: 'Payment parameters generated'
  });
});

exports.confirmPayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  if (order.paymentStatus === 'paid') return res.status(400).json({ success: false, message: 'This order has already been paid' });

  const previousStatus = order.status;
  OrderStateMachine.assertValidTransition(previousStatus, 'processing');

  order.paymentStatus = 'paid';
  order.paidAt = new Date();
  order.status = 'processing';
  order.statusHistory.push({
    from: previousStatus,
    to: 'processing',
    changedBy: null,
    changedAt: new Date(),
    reason: 'Payment confirmed via PayHere callback'
  });

  await order.save();

  res.json({
    success: true,
    data: order,
    message: 'Payment confirmed successfully'
  });
});

exports.handlePayhereNotification = asyncHandler(async (req, res) => {
  const {
    merchant_id,
    order_id,
    payhere_amount,
    payhere_currency,
    status_code,
    md5sig
  } = req.body;

  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET?.trim();

  // Verify signature exactly as PayHere docs specify
  const hashedSecret = crypto
    .createHash('md5')
    .update(merchantSecret)
    .digest('hex')
    .toUpperCase();

  const localMd5sig = crypto
    .createHash('md5')
    .update(
      merchant_id +
      order_id +
      payhere_amount +
      payhere_currency +
      status_code +
      hashedSecret
    )
    .digest('hex')
    .toUpperCase();

  if (localMd5sig !== md5sig) {
    return res.status(400).json({ success: false, message: 'Invalid signature' });
  }

  if (Number(status_code) !== 2) {
    return res.status(200).json({ success: true, message: 'Notification received' });
  }

  const order = await Order.findById(order_id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  if (order.paymentStatus === 'paid') return res.status(200).json({ success: true, message: 'Already paid' });

  const previousStatus = order.status;
  OrderStateMachine.assertValidTransition(previousStatus, 'processing');

  order.paymentStatus = 'paid';
  order.paidAt = new Date();
  order.status = 'processing';
  order.statusHistory.push({
    from: previousStatus,
    to: 'processing',
    changedBy: null,
    changedAt: new Date(),
    reason: 'Payment confirmed via PayHere notification'
  });

  await order.save();
  res.status(200).json({ success: true, message: 'Payment confirmed' });
});
