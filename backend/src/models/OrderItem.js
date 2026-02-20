const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
    {
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
        medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },

        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('OrderItem', orderItemSchema);
