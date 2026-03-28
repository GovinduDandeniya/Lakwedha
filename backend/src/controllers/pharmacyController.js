const Prescription = require('../models/Prescription');
const Order        = require('../models/Order');
const User         = require('../models/user');
const Pharmacy     = require('../models/pharmacy.model');

const asyncHandler = require('../utils/asyncHandler');
const { ORDER_STATUSES } = require('../utils/orderStateMachine');

/**
 * Handle Pharmacy Admin Operations
 * Strictly for Pharmacist Admin use.
 */

// GET Dashboard Stats for the logged-in pharmacy
exports.getPharmacyStats = asyncHandler(async (req, res) => {
    const pharmacyId = req.user.id;
    
    // Counts for the pharmacist dashboard
    const pendingPrescriptions = await Prescription.countDocuments({ 
        pharmacyId, 
        pharmacyStatus: 'pending' 
    });

    const activeOrders = await Order.countDocuments({ 
        pharmacyId, 
        status: { $in: [ORDER_STATUSES.APPROVED, ORDER_STATUSES.PROCESSING, ORDER_STATUSES.SHIPPED] } 
    });

    // Completed Today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const completedToday = await Order.countDocuments({
        pharmacyId,
        status: ORDER_STATUSES.COMPLETED,
        updatedAt: { $gte: startOfToday }
    });

    res.json({
        success: true,
        data: {
            pendingPrescriptions,
            activeOrders,
            completedToday
        },
        message: 'Pharmacy statistics fetched successfully'
    });
});

// GET all prescriptions for this pharmacy
exports.getAllPrescriptions = asyncHandler(async (req, res) => {
    const filter = req.user && req.user.role === 'pharmacist' ? { pharmacyId: req.user.id } : {};
    const prescriptions = await Prescription.find(filter).sort({ createdAt: -1 }).lean();

    const orders = await Order.find({
        prescriptionId: { $in: prescriptions.map((p) => p._id) },
    }).lean();

    const orderMap = {};
    orders.forEach((order) => {
        orderMap[order.prescriptionId.toString()] = order;
    });

    const enrichedPrescriptions = prescriptions.map((p) => {
        const order = orderMap[p._id.toString()];
        return order
            ? {
                  ...p,
                  orderId: order._id.toString(),
                  orderStatus: order.status,
                  paymentStatus: order.paymentStatus,
              }
            : p;
    });

    res.json({
        success: true,
        data: enrichedPrescriptions,
        message: 'Prescriptions fetched successfully',
    });
});

// GET nearby pharmacies
exports.getNearbyPharmacies = asyncHandler(async (req, res) => {
    const { province, district, city } = req.query;

    const locationFilter = {};
    if (province) locationFilter.province = { $regex: new RegExp(`^${province}$`, 'i') };
    if (district) locationFilter.district = { $regex: new RegExp(`^${district}$`, 'i') };
    if (city)     locationFilter.city     = { $regex: new RegExp(city, 'i') };

    // Primary: new Pharmacy registration model
    const registrationPharmacies = await Pharmacy.find({ status: 'approved', ...locationFilter })
        .select('pharmacyName address phone province district city')
        .lean();

    // Secondary: legacy pharmacies stored in User model (role=pharmacy, status=active)
    const legacyPharmacies = await User.find({ role: 'pharmacy', status: 'active', ...locationFilter })
        .select('pharmacyName name address phone province district city')
        .lean();

    const normalize = (p) => ({ ...p, name: p.pharmacyName || p.name || 'Pharmacy' });

    const data = [
        ...registrationPharmacies.map(normalize),
        ...legacyPharmacies.map(normalize),
    ];

    res.json({
        success: true,
        data,
        message: 'Pharmacies fetched successfully',
    });
});

// Patient: Upload Prescription
exports.uploadPrescription = asyncHandler(async (req, res) => {
    const { imageUrl, patientName, pharmacyId } = req.body;
    const userId = req.body.userId || (req.user ? req.user.id : null);

    if (!userId) {
        return res.status(400).json({ success: false, data: null, message: 'User ID is required context.' });
    }

    if (!imageUrl) {
        return res.status(400).json({ success: false, data: null, message: 'Prescription image is required.' });
    }

    if (!pharmacyId) {
        return res.status(400).json({ success: false, data: null, message: 'Pharmacy ID is required.' });
    }

    const pharmacy = await User.findOne({ _id: pharmacyId, role: 'pharmacist' });
    if (!pharmacy) {
        return res.status(404).json({ success: false, data: null, message: 'Selected pharmacy not found.' });
    }

    const prescription = await Prescription.create({
        userId,
        pharmacyId,
        imageUrl,
        patientName: patientName || req.user.name || 'Guest Patient',
        pharmacyStatus: 'pending',
    });

    res.status(201).json({
        success: true,
        data: prescription,
        message: 'Prescription submitted successfully',
    });
});

// Review prescription (Approve/Reject)
exports.reviewPrescription = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, medicines, rejectionReason } = req.body;

    const prescription = await Prescription.findById(id);
    if (!prescription) {
        return res.status(404).json({ success: false, data: null, message: 'Prescription not found' });
    }

    if (req.user && req.user.role === 'pharmacist' && prescription.pharmacyId.toString() !== req.user.id.toString()) {
        return res.status(403).json({ success: false, data: null, message: 'Unauthorized review access.' });
    }

    if (prescription.pharmacyStatus !== 'pending') {
        return res.status(400).json({ success: false, data: null, message: `Prescription is already ${prescription.pharmacyStatus}` });
    }

    if (status === 'rejected') {
        if (!rejectionReason || rejectionReason.trim().length < 10) {
            return res.status(400).json({ success: false, data: null, message: 'Rejection reason must be at least 10 characters long.' });
        }
        prescription.pharmacyStatus = 'rejected';
        prescription.rejectionReason = rejectionReason;
        await prescription.save();

        return res.json({ success: true, data: prescription, message: 'Prescription rejected successfully' });
    }

    if (status === 'approved') {
        if (!medicines || medicines.length === 0) {
            return res.status(400).json({ success: false, data: null, message: 'Medicines and prices required for approval.' });
        }

        for (const m of medicines) {
            const qty = Number(m.qty || m.quantity);
            const price = Number(m.unitPrice || m.price);
            if (!m.name || !String(m.name).trim()) {
                return res.status(400).json({ success: false, data: null, message: 'Each medicine must have a name.' });
            }
            if (isNaN(qty) || qty <= 0) {
                return res.status(400).json({ success: false, data: null, message: `Invalid quantity for medicine "${m.name}". Must be a positive number.` });
            }
            if (isNaN(price) || price <= 0) {
                return res.status(400).json({ success: false, data: null, message: `Invalid price for medicine "${m.name}". Must be a positive number.` });
            }
        }

        prescription.medicines = medicines.map((m) => ({
            name: m.name,
            quantity: Number(m.qty || m.quantity),
            price: Number(m.unitPrice || m.price),
        }));

        prescription.pharmacyStatus = 'approved';

        const DELIVERY_FEE = parseFloat(process.env.PHARMACY_DELIVERY_FEE) || 350;
        const TAX_RATE = parseFloat(process.env.PHARMACY_TAX_RATE) || 0.05;

        const subtotal = prescription.medicines.reduce((sum, item) => sum + item.quantity * item.price, 0);
        const tax = subtotal * TAX_RATE;
        const deliveryFee = DELIVERY_FEE;
        const totalAmount = subtotal + tax + deliveryFee;

        prescription.subtotal = subtotal;
        prescription.tax = tax;
        prescription.deliveryFee = deliveryFee;
        prescription.totalAmount = totalAmount;

        await prescription.save();

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
            statusHistory: [
                {
                    from: 'none',
                    to: ORDER_STATUSES.APPROVED,
                    changedBy: req.user ? req.user.id : null,
                    changedAt: new Date(),
                    reason: 'Order automatically generated on prescription approval',
                },
            ],
        });

        return res.json({ success: true, data: { prescription, order }, message: 'Prescription approved and order generated' });
    }

    return res.status(400).json({ success: false, data: null, message: 'Invalid status update.' });
});

// Update medicines
exports.updatePrescriptionMedicines = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { medicines } = req.body;

    const prescription = await Prescription.findById(id);
    if (!prescription) {
        return res.status(404).json({ success: false, data: null, message: 'Prescription not found' });
    }

    if (req.user && req.user.role === 'pharmacist' && prescription.pharmacyId.toString() !== req.user.id.toString()) {
        return res.status(403).json({ success: false, data: null, message: 'Unauthorized edit access.' });
    }

    if (prescription.pharmacyStatus !== 'pending') {
        return res.status(400).json({ success: false, data: null, message: 'Denied: Prescription processed.' });
    }

    for (const m of medicines) {
        const qty = Number(m.qty || m.quantity);
        const price = Number(m.unitPrice || m.price);
        if (!m.name || !String(m.name).trim()) {
            return res.status(400).json({ success: false, data: null, message: 'Each medicine must have a name.' });
        }
        if (isNaN(qty) || qty <= 0) {
            return res.status(400).json({ success: false, data: null, message: `Invalid quantity for medicine "${m.name}". Must be a positive number.` });
        }
        if (isNaN(price) || price <= 0) {
            return res.status(400).json({ success: false, data: null, message: `Invalid price for medicine "${m.name}". Must be a positive number.` });
        }
    }

    prescription.medicines = medicines.map((m) => ({
        name: m.name,
        quantity: Number(m.qty || m.quantity),
        price: Number(m.unitPrice || m.price),
    }));
    await prescription.save();

    res.json({ success: true, data: prescription, message: 'Medicines updated explicitly' });
});
