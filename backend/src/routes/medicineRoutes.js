const express = require('express');
const router = express.Router();
const Medicine = require('../models/Medicine');
const asyncHandler = require('../utils/asyncHandler');
const auth = require('../middleware/auth');

// GET all medicines
router.get('/', asyncHandler(async (req, res) => {
    const medicines = await Medicine.find().sort({ name: 1 });
    res.json({ success: true, data: medicines, message: 'Medicines fetched' });
}));

// POST create medicine (Admin only - bypassed in dev for now)
router.post('/', auth, asyncHandler(async (req, res) => {
    const { name, description, price, unit, category, stockQuantity } = req.body;
    
    // Check if exists
    let medicine = await Medicine.findOne({ name });
    if (medicine) {
        return res.status(400).json({ success: false, data: null, message: 'Medicine with this name already exists' });
    }

    medicine = await Medicine.create({
        name,
        description,
        price,
        unit,
        category,
        stockQuantity
    });

    res.status(201).json({ success: true, data: medicine, message: 'Medicine created successfully' });
}));

// DELETE medicine
router.delete('/:id', auth, asyncHandler(async (req, res) => {
    await Medicine.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: null, message: 'Medicine deleted successfully' });
}));

module.exports = router;
