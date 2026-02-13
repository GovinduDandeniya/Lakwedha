require('dotenv').config(); // .env is in src/
const mongoose = require('mongoose');
const Prescription = require('../models/Prescription');

console.log('MONGO_URI =', process.env.MONGO_URI); // check if it's loaded

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

const createDummy = async () => {
    const doc = await Prescription.create({
        userId: new mongoose.Types.ObjectId(),
        imageUrl: 'http://example.com/prescription1.jpg',
        doctorStatus: 'approved',
        pharmacyStatus: 'pending',
    });
    console.log('Dummy prescription created:', doc);
    process.exit();
};

createDummy();
