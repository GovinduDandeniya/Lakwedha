const mongoose = require('mongoose');
const Order = require('./src/models/Order');
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const orders = await Order.find({ pharmacyId: { $exists: false } });
    console.log('Orders missing pharmacyId:', orders.length);
    if (orders.length > 0) {
        console.log('Sample order without pharmacyId:', orders[0]._id);
    }
    await mongoose.disconnect();
}
check();
