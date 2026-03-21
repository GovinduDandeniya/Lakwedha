const Prescription = require('../models/Prescription');
const Order = require('../models/Order');
const { reviewPrescriptionSchema, updateMedicinesSchema } = require('../utils/validationSchemas');
const logger = require('../utils/logger');

// GET all prescriptions
exports.getAllPrescriptions = async (req, res, next) => {
    try {
        logger.info('Fetching all prescriptions');
        const prescriptions = await Prescription.find().sort({ issuedDate: -1, createdAt: -1 });
        res.json(prescriptions);
    } catch (err) {
        logger.error(`Error fetching prescriptions: ${err.message}`);
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

        logger.info(`Reviewing prescription ${id} | Total: ${totalAmount} | Status: ${status}`);

        const prescription = await Prescription.findById(id);
        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        // 1. Synchronize Prescription State
        if (medicines) {
            prescription.medications = medicines.map(m => ({
                name: m.name,
                dosage: m.dosage || m.qty || '',
                duration: m.duration || '',
                quantity: Number(m.qty) || 0,
                price: Number(m.unitPrice) || 0
            }));
        }

        prescription.pharmacyStatus = status;
        await prescription.save();

        // 2. Spawn Order Record
        if (status === 'approved') {
            const order = await Order.create({
                userId: prescription.patientId, // map to patientId
                prescriptionId: prescription._id,
                medicines: prescription.medications || [],
                totalAmount: Number(totalAmount), // Direct trust of FE value
                status: 'pending',
                paymentStatus: 'pending'
            });
            logger.info(`Financial Checkpoint: Order ${order._id} initialized with FE total: ${totalAmount}`);
        }

        res.json({
            message: `Prescription ${prescription.pharmacyStatus}`,
            prescription
        });
    } catch (err) {
        logger.error(`Error reviewing prescription: ${err.message}`);
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

        logger.info(`Updating medicines for prescription ${id}`);

        const prescription = await Prescription.findById(id);
        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        prescription.medications = medicines.map(m => ({
            name: m.name,
            dosage: m.dosage || m.qty || '',
            duration: m.duration || '',
            quantity: Number(m.qty) || 0,
            price: Number(m.unitPrice) || 0
        }));
        await prescription.save();

        logger.info(`Medicines updated for prescription ${id}`);
        res.json({ message: 'Medicines updated successfully', prescription });
    } catch (err) {
        logger.error(`Error updating medicines: ${err.message}`);
        next(err);
    }
};
