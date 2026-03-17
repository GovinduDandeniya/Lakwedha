const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    name:       { type: String, required: true },
    email:      { type: String, required: true, unique: true },
    password:   { type: String, required: true },
    phone:      { type: String, default: '' },
    age:        { type: Number },
    gender:     { type: String, enum: ['male', 'female', 'other'], default: 'male' },
    bloodGroup: { type: String, default: '' },
    role:       { type: String, default: 'patient' },
    createdAt:  { type: Date, default: Date.now },
    updatedAt:  { type: Date, default: Date.now },
});

module.exports = mongoose.model('Patient', patientSchema);
