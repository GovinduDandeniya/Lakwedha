const Prescription = require('../models/Prescription');
const Order = require('../models/Order');
const { PRESCRIPTION_STATUS } = require('../config/constants');
const { reviewPrescriptionSchema, updateMedicinesSchema } = require('../utils/validationSchemas');

// GET all prescriptions
exports.getAllPrescriptions = async (req, res, next) => {
    try {
        console.log('Fetching all prescriptions');
        const prescriptions = await Prescription.find().sort({ createdAt: -1 });
        res.json(prescriptions);
    } catch (err) {
        next(err);
    }
};

// Patient: Upload Prescription
exports.uploadPrescription = async (req, res, next) => {
    try {
        const { imageUrl, patientName, userId } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ message: 'Prescription image is required.' });
        }

        const prescription = await Prescription.create({
            userId: userId || '65cc6e32d18442001c8a1234', // Dummy ID if not logged in
            imageUrl,
            patientName: patientName || 'Guest Patient',
            pharmacyStatus: 'pending'
        });

        console.log(`New prescription uploaded: ${prescription._id}`);
        res.status(201).json({ message: 'Prescription submitted successfully', prescription });
    } catch (err) {
        next(err);
    }
};

// Review prescription (Approve/Reject)
exports.reviewPrescription = async (req, res, next) => {
    try {
        const { error } = reviewPrescriptionSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { id } = req.params;
        const { status, medicines, totalAmount } = req.body;

        console.log(`Reviewing prescription ${id} | Total: ${totalAmount} | Status: ${status}`);

        const prescription = await Prescription.findById(id);
        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        // 1. Update Prescription State
        if (medicines) {
            prescription.medicines = medicines.map(m => ({
                name: m.name,
                quantity: Number(m.qty),
                price: Number(m.unitPrice)
            }));
        }

        prescription.pharmacyStatus = status;
        await prescription.save();

        // 2. Spawn Order Record
        if (status === 'approved') {
             const order = await Order.create({
                userId: prescription.userId,
                prescriptionId: prescription._id,
                medicines: prescription.medicines,
                totalAmount: Number(totalAmount),
                status: 'pending',
                paymentStatus: 'pending'
            });

            console.log(`Order created: ${order._id}`);
        }

        res.json({
            message: `Prescription ${prescription.pharmacyStatus}`,
            prescription
        });
    } catch (err) {
        next(err);
    }
};

// Update medicines
exports.updatePrescriptionMedicines = async (req, res, next) => {
    try {
        const { error } = updateMedicinesSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { id } = req.params;
        const { medicines } = req.body;

        console.log(`Updating medicines for prescription ${id}`);

        const prescription = await Prescription.findById(id);
        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        prescription.medicines = medicines;
        await prescription.save();

        console.log(`Medicines updated for prescription ${id}`);
        res.json({ message: 'Medicines updated successfully', prescription });
    } catch (err) {
        next(err);
    }
};
