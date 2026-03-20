const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  mobile:   { type: String, required: true },
  nic:      { type: String, required: true },
  password: { type: String, required: true },
  role:     { type: String, default: "admin" },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("Admin", adminSchema);
