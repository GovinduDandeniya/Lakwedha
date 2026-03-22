const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
        },
        unit: {
            type: String, // e.g., '10 tablets', '100ml'
            default: 'per unit',
        },
        stockQuantity: {
            type: Number,
            default: 100,
        },
        category: {
            type: String,
            enum: ['Herbal', 'Mineral', 'Oil', 'Tablets', 'Syrup'],
            default: 'Herbal',
        },
        imageUrl: {
            type: String,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Medicine', medicineSchema);
