const Prescription = require('../models/Prescription');
const Order = require('../models/Order');

// GET all prescriptions
exports.getAllPrescriptions = async (req, res, next) => {
    try {
        console.log('Fetching all prescriptions');
        const prescriptions = await Prescription.find().sort({ issuedDate: -1, createdAt: -1 });
        res.json(prescriptions);
    } catch (err) {
        next(err);
    }
};

// Review prescription (Approve/Reject)
exports.reviewPrescription = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, medicines, totalAmount } = req.body;

        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }

        console.log(`Reviewing prescription ${id} | Total: ${totalAmount} | Status: ${status}`);

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
            console.log(`Financial Checkpoint: Order ${order._id} initialized with FE total: ${totalAmount}`);
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
        const { id } = req.params;
        const { medicines } = req.body;

        if (!medicines || !Array.isArray(medicines)) {
            return res.status(400).json({ message: 'Valid medicines array is required' });
        }

        console.log(`Updating medicines for prescription ${id}`);

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

        console.log(`Medicines updated for prescription ${id}`);
        res.json({ message: 'Medicines updated successfully', prescription });
    } catch (err) {
        next(err);
    }
};
