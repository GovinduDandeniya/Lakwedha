const mongoose = require('mongoose');

const pharmacySchema = new mongoose.Schema({
  pharmacyName: {
    type: String,
    required: true,
    trim: true,
  },

  businessRegNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },

  permitNumber: {
    type: String,
    required: true,
    trim: true,
  },

  // Location
  province: {
    type: String,
    required: true,
  },

  district: {
    type: String,
    required: true,
  },

  city: {
    type: String,
    required: true,
    trim: true,
  },

  address: {
    type: String,
    required: true,
    trim: true,
  },

  postalCode: {
    type: String,
    required: true,
    trim: true,
  },

  // Owner
  ownerName: {
    type: String,
    required: true,
    trim: true,
  },

  ownerNIC: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  password: {
    type: String,
    required: true,
  },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },

  bankDetails: {
    bankName:          { type: String, default: null },
    branchName:        { type: String, default: null },
    accountNumber:     { type: String, default: null },
    accountHolderName: { type: String, default: null },
    accountType:       { type: String, enum: ['Savings', 'Current', null], default: null },
  },

  rejectionReason: {
    type: String,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Pharmacy', pharmacySchema);
