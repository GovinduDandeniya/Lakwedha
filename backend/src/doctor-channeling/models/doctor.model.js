const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    qualification: { type: String, default: '' },
    experience: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    profileImage: { type: String, default: null },
    clinicName: { type: String, default: '' },
    clinicAddress: { type: String, default: '' },
    consultationFee: { type: Number, default: 0 },
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClinicLocation' },
    city: { type: String },
    district: { type: String },
    contactNumber: { type: String },
    isVerified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

doctorSchema.index({ name: 'text', specialization: 'text', clinicName: 'text' });

module.exports = mongoose.model('Doctor', doctorSchema);
