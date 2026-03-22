const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const Prescription = require('./src/models/Prescription');
require('dotenv').config();

async function migrate() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // 1. Find orders missing pharmacyId
    const orders = await Order.find({ pharmacyId: { $exists: false } });
    console.log(`Found ${orders.length} orders missing pharmacyId. Migrating...`);

    for (const order of orders) {
        // 2. Try to find the prescription associated with the order
        const prescription = await Prescription.findById(order.prescriptionId);
        if (prescription && prescription.pharmacyId) {
            console.log(`Fixing order ${order._id}: Setting pharmacyId to ${prescription.pharmacyId}`);
            order.pharmacyId = prescription.pharmacyId;
            await order.save();
        } else {
            console.log(`Warning: Order ${order._id} has no valid prescription with pharmacyId. Manual fix required.`);
        }
    }

    console.log('Migration complete.');
    await mongoose.disconnect();
}

migrate().catch(console.error);
