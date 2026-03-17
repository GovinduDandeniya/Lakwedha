const Prescription = require('../models/Prescription');
const { PRESCRIPTION_STATUS } = require('../config/constants');

// GET all prescriptions (for pharmacy view)
exports.getAllPrescriptions = async (req, res) => {
    try {
        console.log('Fetching all prescriptions');
        const prescriptions = await Prescription.find().sort({ createdAt: -1 });
        res.json(prescriptions);
    } catch (err) {
        console.error('Error fetching prescriptions:', err);
        res.status(500).json({ message: 'Server error fetching prescriptions' });
    }
};

// Review prescription (Approve/Reject)
exports.reviewPrescription = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'approve' or 'reject'

        console.log(`Reviewing prescription ${id} with action: ${action}`);

        const prescription = await Prescription.findById(id);
        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        // Validate that only pending prescriptions can be updated
        if (prescription.pharmacyStatus !== PRESCRIPTION_STATUS.PENDING) {
            return res.status(400).json({
                message: `Cannot update prescription. Current status is ${prescription.pharmacyStatus}`
            });
        }

        if (action === 'approve') {
            prescription.pharmacyStatus = PRESCRIPTION_STATUS.APPROVED;
        } else if (action === 'reject') {
            prescription.pharmacyStatus = PRESCRIPTION_STATUS.REJECTED;
        } else {
            return res.status(400).json({ message: 'Invalid action. Use "approve" or "reject".' });
        }

        await prescription.save();
        console.log(`Prescription ${id} updated to ${prescription.pharmacyStatus}`);

        res.json({ message: `Prescription ${prescription.pharmacyStatus}`, prescription });
    } catch (err) {
        console.error(`Error reviewing prescription ${req.params.id}:`, err);
        res.status(500).json({ message: 'Server error reviewing prescription' });
    }
};

// Update medicines for a prescription
exports.updatePrescriptionMedicines = async (req, res) => {
    try {
        const { id } = req.params;
        const { medicines } = req.body; // Array of { name, quantity, price }

        console.log(`Updating medicines for prescription ${id}`);

        if (!Array.isArray(medicines)) {
            return res.status(400).json({ message: 'Medicines must be an array' });
        }

        // Validate medicines payload
        for (const med of medicines) {
            if (!med.name || typeof med.name !== 'string') {
                return res.status(400).json({ message: 'Invalid medicine name' });
            }
            if (!med.quantity || med.quantity <= 0) {
                return res.status(400).json({ message: `Invalid quantity for ${med.name}` });
            }
            if (med.price === undefined || med.price < 0) {
                return res.status(400).json({ message: `Invalid price for ${med.name}` });
            }
        }

        const prescription = await Prescription.findById(id);
        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        // Optionally check if we can update medicines (e.g., only if pending or approved?)
        // Requirement doesn't strictly say, but usually shouldn't update if rejected?
        // Assume allowed if prescription exists for now.

        prescription.medicines = medicines;
        await prescription.save();

        console.log(`Medicines updated for prescription ${id}`);
        res.json({ message: 'Medicines updated successfully', prescription });
    } catch (err) {
        console.error(`Error updating medicines for prescription ${req.params.id}:`, err);
        res.status(500).json({ message: 'Server error updating medicines' });
    }
};
