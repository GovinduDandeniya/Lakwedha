const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    const email    = 'admin1@lakwedha.com';
    const password = 'WgAvi@2006';

    const existing = await Admin.findOne({ email });
    if (existing) {
        console.log('Admin already exists:', existing.email);
        await mongoose.disconnect();
        return;
    }

    const hashed = await bcrypt.hash(password, 12);
    await Admin.create({
        fullName: 'Admin One',
        email,
        mobile:   '+94771234567',
        nic:      '200012345678',
        password: hashed,
    });

    console.log('Admin created:', email);
    await mongoose.disconnect();
}

seed().catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
});
