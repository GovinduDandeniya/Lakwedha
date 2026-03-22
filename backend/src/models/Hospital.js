const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  city: {
    type: String,
    trim: true,
    default: '',
  },
  type: {
    type: String,
    enum: ['hospital', 'clinic'],
    default: 'hospital',
  },
  contactNumber: {
    type: String,
    default: '',
  },
  adminCharge: {
    type: Number,
    default: 0,
    min: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Hospital', hospitalSchema);
