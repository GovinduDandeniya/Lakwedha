const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas');

    // Check if admin already exists
    const existing = await User.findOne({ email: 'admin@lakwedha.com' });
    if (existing) {
        console.log('Admin user already exists:', existing.email);
        await mongoose.disconnect();
        return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
        name: 'Admin',
        email: 'admin@lakwedha.com',
        password: hashedPassword,
        role: 'admin',
        status: 'active',
    });

    console.log('Admin user created:', admin.email);
    await mongoose.disconnect();
}

seed().catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
});
