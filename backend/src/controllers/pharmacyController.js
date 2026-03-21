const Prescription = require('../models/Prescription');
const Order = require('../models/Order');
const User = require('../models/user');

const asyncHandler = require('../utils/asyncHandler');
const { ORDER_STATUSES } = require('../utils/orderStateMachine');

// GET /api/pharmacy/nearby — filter pharmacists by province, district, city
exports.getNearbyPharmacies = asyncHandler(async (req, res) => {
    const { province, district, city } = req.query;

    const filter = { role: 'pharmacist' };
    if (province) filter.province = { $regex: new RegExp(`^${province}$`, 'i') };
    if (district) filter.district = { $regex: new RegExp(`^${district}$`, 'i') };
    if (city)     filter.city     = { $regex: new RegExp(city, 'i') };

    const pharmacies = await User.find(filter)
        .select('name address phone province district city')
        .lean();

    res.json({
        success: true,
        data: pharmacies,
        message: 'Pharmacies fetched successfully',
    });
});



// GET all prescriptions
exports.getAllPrescriptions = asyncHandler(async (req, res) => {
    // Filter by the logged-in pharmacy's user ID if they are a pharmacist
    const filter = req.user && req.user.role === 'pharmacist' ? { pharmacyId: req.user.id } : {};
    const prescriptions = await Prescription.find(filter).sort({ createdAt: -1 }).lean();

    // Join with Orders to get tracking and payment status
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

// Patient: Upload Prescription
exports.uploadPrescription = asyncHandler(async (req, res) => {
    const { imageUrl, patientName, pharmacyId } = req.body;

    // Fallback logic: Use userId from body (legacy/test) or authenticated id
    const userId = req.body.userId || (req.user ? req.user.id : null);

    if (!userId) {
        return res
            .status(400)
            .json({
                success: false,
                data: null,
                message: 'User ID is required context for prescription upload.',
            });
    }

    if (!imageUrl) {
        return res
            .status(400)
            .json({ success: false, data: null, message: 'Prescription image is required.' });
    }

    if (!pharmacyId) {
        return res
            .status(400)
            .json({
                success: false,
                data: null,
                message: 'Pharmacy ID is required to route your prescription.',
            });
    }

    // Validate Pharmacy Existence & Role
    const pharmacy = await User.findOne({ _id: pharmacyId, role: 'pharmacist' });
    if (!pharmacy) {
        return res
            .status(404)
            .json({
                success: false,
                data: null,
                message: 'Selected pharmacy not found or invalid.',
            });
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
    // Note: If Joi scheme blocks rejectionReason, we extract what we need directly.
    const { id } = req.params;
    const { status, medicines, rejectionReason } = req.body;

    const prescription = await Prescription.findById(id);
    if (!prescription) {
        return res
            .status(404)
            .json({ success: false, data: null, message: 'Prescription not found' });
    }

    // Role-based security: A pharmacist can only review prescriptions assigned to them
    if (
        req.user &&
        req.user.role === 'pharmacist' &&
        prescription.pharmacyId.toString() !== req.user.id.toString()
    ) {
        return res
            .status(403)
            .json({
                success: false,
                data: null,
                message:
                    'Unauthorized: You can only review prescriptions assigned to your pharmacy.',
            });
    }

    // Only allow reviewing if pending
    if (prescription.pharmacyStatus !== 'pending') {
        return res
            .status(400)
            .json({
                success: false,
                data: null,
                message: `Prescription is already ${prescription.pharmacyStatus}`,
            });
    }

    if (status === 'rejected') {
        if (!rejectionReason || rejectionReason.trim().length < 10) {
            return res
                .status(400)
                .json({
                    success: false,
                    data: null,
                    message: 'Rejection reason must be at least 10 characters long.',
                });
        }
        prescription.pharmacyStatus = 'rejected';
        prescription.rejectionReason = rejectionReason;
        await prescription.save();

        return res.json({
            success: true,
            data: prescription,
            message: 'Prescription rejected successfully',
        });
    }

    if (status === 'approved') {
        if (!medicines || medicines.length === 0) {
            return res
                .status(400)
                .json({
                    success: false,
                    data: null,
                    message: 'Cannot approve prescription without assigning medicines and prices.',
                });
        }

        // Format medicines properly
        prescription.medicines = medicines.map((m) => ({
            name: m.name,
            quantity: Number(m.qty || m.quantity),
            price: Number(m.unitPrice || m.price),
        }));

        prescription.pharmacyStatus = 'approved';
        await prescription.save();

        // Calculate prices manually
        const subtotal = prescription.medicines.reduce(
            (sum, item) => sum + item.quantity * item.price,
            0
        );
        const tax = subtotal * 0.05; // 5% tax
        const deliveryFee = 350; // Flat fee
        const totalAmount = subtotal + tax + deliveryFee;

        // Create Order
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
                    reason: 'Order automatically generated on prescription approval',
                },
            ],
        });

        return res.json({
            success: true,
            data: { prescription, order },
            message: 'Prescription approved and order generated securely',
        });
    }

    return res.status(400).json({ success: false, data: null, message: 'Invalid status update.' });
});

// Update medicines
exports.updatePrescriptionMedicines = asyncHandler(async (req, res) => {
    // Note: Assuming validationSchemas handles Joi checks if needed, but wrapper safely errors.
    const { id } = req.params;
    const { medicines } = req.body;

    const prescription = await Prescription.findById(id);
    if (!prescription) {
        return res
            .status(404)
            .json({ success: false, data: null, message: 'Prescription not found' });
    }

    // Role-based security: A pharmacist can only edit prescriptions assigned to them
    if (
        req.user &&
        req.user.role === 'pharmacist' &&
        prescription.pharmacyId.toString() !== req.user.id.toString()
    ) {
        return res
            .status(403)
            .json({
                success: false,
                data: null,
                message: 'Unauthorized: You can only edit prescriptions assigned to your pharmacy.',
            });
    }

    // Only allow editing if pending — once approved/rejected, the quote is fixed.
    if (prescription.pharmacyStatus !== 'pending') {
        return res
            .status(400)
            .json({
                success: false,
                data: null,
                message: 'Denied: Prescription medicines cannot be updated once processed.',
            });
    }

    prescription.medicines = medicines.map((m) => ({
        name: m.name,
        quantity: Number(m.qty || m.quantity),
        price: Number(m.unitPrice || m.price),
    }));
    await prescription.save();

    res.json({ success: true, data: prescription, message: 'Medicines updated successfully' });
});
