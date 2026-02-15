const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const User = require('./models/user');
const Prescription = require('./models/Prescription');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Create a dummy user if none exists
    let user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      user = await User.create({
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password123', // In real app, this should be hashed
        role: 'user'
      });
      console.log('Created dummy user');
    }

    // 2. Clear existing prescriptions (optional, but good for clean testing)
    await Prescription.deleteMany({ userId: user._id });
    console.log('Cleared old prescriptions for test user');

    // 3. Create dummy prescriptions
    const dummyPrescriptions = [
      {
        userId: user._id,
        patientName: 'Gamini Perera',
        imageUrl: 'https://placehold.co/600x400/5D4037/FFF8E1?text=Ayu+Prescription+1',
        pharmacyStatus: 'pending',
        doctorStatus: 'approved',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
      },
      {
        userId: user._id,
        patientName: 'Anula Kumari',
        imageUrl: 'https://placehold.co/600x400/2E7D32/FFF8E1?text=Ayu+Prescription+2',
        pharmacyStatus: 'pending',
        doctorStatus: 'approved',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
      }
    ];

    await Prescription.insertMany(dummyPrescriptions);
    console.log('Successfully seeded 2 pending prescriptions');

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
