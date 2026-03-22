const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const User = require('./src/models/user');
require('dotenv').config();

async function migrate() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const pharmacist = await User.findOne({ role: 'pharmacist' });
    if (!pharmacist) {
        console.log('No pharmacist found. Migration aborted.');
        await mongoose.disconnect();
        return;
    }

    const orders = await Order.find({ 
        $or: [
            { pharmacyId: { $exists: false } },
            { pharmacyId: null }
        ]
    });
    
    console.log(`Assigning ${orders.length} orphaned orders to pharmacist Admin (${pharmacist._id})...`);

    for (const order of orders) {
        order.pharmacyId = pharmacist._id;
        // Also fix totalAmount if missing
        if (!order.totalAmount || order.totalAmount === 200) {
            order.totalAmount = (order.subtotal || 0) + (order.tax || 0) + (order.deliveryFee || 350);
            if (order.totalAmount < 350) order.totalAmount = 350; // Minimum delivery fee
        }
        await order.save();
    }

    console.log('Orphan migration complete.');
    await mongoose.disconnect();
}

migrate().catch(console.error);
