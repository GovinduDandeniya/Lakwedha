const mongoose = require('mongoose');

const registeredDoctorSchema = new mongoose.Schema({
  title: String,
  firstName: String,
  lastName: String,
  fullName: String,

  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true,
  },

  mobile: String,

  nic: {
    type: String,
    required: true,
    unique: true,
  },

  address: String,
  emergencyMobile: String,

  specialization: {
    type: String,
    required: true,
  },

  hospitals: [
    {
      name: String,
      location: String,
      startTime: String,
      maxAppointments: Number,
    },
  ],

  bankDetails: {
    bankName:          { type: String, default: null },
    branchName:        { type: String, default: null },
    accountNumber:     { type: String, default: null },
    accountHolderName: { type: String, default: null },
    accountType:       { type: String, enum: ['Savings', 'Current', null], default: null },
  },

  password: {
    type: String,
    required: true,
  },

  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'DECLINED'],
    default: 'PENDING',
  },

  declineReason: {
    type: String,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('RegisteredDoctor', registeredDoctorSchema);
