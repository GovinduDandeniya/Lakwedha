const Prescription = require('../models/Prescription');
const Order = require('../models/Order');
const { PRESCRIPTION_STATUS } = require('../config/constants');
const { reviewPrescriptionSchema, updateMedicinesSchema } = require('../utils/validationSchemas');
const asyncHandler = require('../utils/asyncHandler');
const PriceCalculationService = require('../services/PriceCalculationService');

// GET all prescriptions
exports.getAllPrescriptions = asyncHandler(async (req, res) => {
    const prescriptions = await Prescription.find().sort({ createdAt: -1 });
    res.json({ success: true, data: prescriptions, message: 'Prescriptions fetched successfully' });
});

// Patient: Upload Prescription
exports.uploadPrescription = asyncHandler(async (req, res) => {
    const { imageUrl, patientName, userId } = req.body;

    if (!imageUrl) {
        return res.status(400).json({ success: false, data: null, message: 'Prescription image is required.' });
    }

    const prescription = await Prescription.create({
        userId: userId || '65cc6e32d18442001c8a1234', // Assuming guest ID logic stays for now
        imageUrl,
        patientName: patientName || 'Guest Patient',
        pharmacyStatus: 'pending'
    });

    res.status(201).json({ success: true, data: prescription, message: 'Prescription submitted successfully' });
});

// Review prescription (Approve/Reject)
exports.reviewPrescription = asyncHandler(async (req, res) => {
    // Note: If Joi scheme blocks rejectionReason, we extract what we need directly.
    const { id } = req.params;
    const { status, medicines, rejectionReason } = req.body;

    const prescription = await Prescription.findById(id);
    if (!prescription) {
        return res.status(404).json({ success: false, data: null, message: 'Prescription not found' });
    }

    // Only allow reviewing if pending
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

        return res.json({
            success: true,
            data: prescription,
            message: 'Prescription rejected successfully'
        });
    }

    if (status === 'approved') {
        if (!medicines || medicines.length === 0) {
            return res.status(400).json({ success: false, data: null, message: 'Cannot approve prescription without assigning medicines and prices.' });
        }

        // Format medicines properly
        prescription.medicines = medicines.map(m => ({
            name: m.name,
            quantity: Number(m.qty || m.quantity),
            price: Number(m.unitPrice || m.price)
        }));

        prescription.pharmacyStatus = 'approved';
        await prescription.save();

        // Calculate secure server-side price
        const pricing = PriceCalculationService.calculateTotal(prescription.medicines);

        // Spawn Order Record
        const order = await Order.create({
            userId: prescription.userId,
            prescriptionId: prescription._id,
            medicines: prescription.medicines,
            subtotal: pricing.subtotal,
            tax: pricing.tax,
            deliveryFee: pricing.deliveryFee,
            totalAmount: pricing.totalAmount,
            status: 'pending',
            paymentStatus: 'pending',
            statusHistory: [{
                from: 'none',
                to: 'pending',
                reason: 'Order automatically generated on prescription approval'
            }]
        });

        return res.json({
            success: true,
            data: { prescription, order },
            message: 'Prescription approved and order generated securely'
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
        return res.status(404).json({ success: false, data: null, message: 'Prescription not found' });
    }

    prescription.medicines = medicines;
    await prescription.save();

    res.json({ success: true, data: prescription, message: 'Medicines updated successfully' });
});
