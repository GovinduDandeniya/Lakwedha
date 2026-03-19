const Pharmacy = require('../models/pharmacy.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'mysecretkey123';

// ── Register ──────────────────────────────────────────────────────────────────
exports.registerPharmacy = async (req, res) => {
  try {
    const {
      pharmacyName,
      businessRegNumber,
      permitNumber,
      province,
      district,
      city,
      address,
      postalCode,
      ownerName,
      ownerNIC,
      email,
      password,
      bankDetails,
    } = req.body;

    if (
      !pharmacyName || !businessRegNumber || !permitNumber ||
      !province || !district || !city || !address || !postalCode ||
      !ownerName || !ownerNIC || !email || !password
    ) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const existingEmail = await Pharmacy.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const existingReg = await Pharmacy.findOne({ businessRegNumber: businessRegNumber.trim() });
    if (existingReg) {
      return res.status(400).json({ success: false, message: 'Business registration number already registered' });
    }

    const existingNIC = await Pharmacy.findOne({ ownerNIC: ownerNIC.trim() });
    if (existingNIC) {
      return res.status(400).json({ success: false, message: 'Owner NIC already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await Pharmacy.create({
      pharmacyName,
      businessRegNumber,
      permitNumber,
      province,
      district,
      city,
      address,
      postalCode,
      ownerName,
      ownerNIC,
      email,
      password: hashedPassword,
      bankDetails: bankDetails || null,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      status: 'pending',
      message: 'Registration submitted. Waiting for admin approval.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
exports.loginPharmacy = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const pharmacy = await Pharmacy.findOne({ email: email.toLowerCase().trim() });
    if (!pharmacy) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const passwordMatch = await bcrypt.compare(password, pharmacy.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (pharmacy.status === 'pending') {
      return res.status(403).json({
        success: false,
        status: 'pending',
        message: 'Your registration is under review. Please wait for admin approval.',
      });
    }

    if (pharmacy.status === 'rejected') {
      return res.status(403).json({
        success: false,
        status: 'rejected',
        message: 'Your registration was rejected.',
        reason: pharmacy.rejectionReason,
      });
    }

    // approved — issue JWT
    const token = jwt.sign(
      { id: pharmacy._id, email: pharmacy.email, role: 'pharmacy' },
      SECRET_KEY,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      status: 'approved',
      token,
      pharmacy: {
        id: pharmacy._id,
        pharmacyName: pharmacy.pharmacyName,
        email: pharmacy.email,
        ownerName: pharmacy.ownerName,
        city: pharmacy.city,
        district: pharmacy.district,
        province: pharmacy.province,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Approve ───────────────────────────────────────────────────────────────────
exports.approvePharmacy = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id);
    if (!pharmacy) {
      return res.status(404).json({ success: false, message: 'Pharmacy not found' });
    }

    pharmacy.status = 'approved';
    pharmacy.rejectionReason = null;
    await pharmacy.save();

    res.json({ success: true, message: 'Pharmacy approved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Reject ────────────────────────────────────────────────────────────────────
exports.rejectPharmacy = async (req, res) => {
  try {
    const { reason } = req.body;
    const pharmacy = await Pharmacy.findById(req.params.id);
    if (!pharmacy) {
      return res.status(404).json({ success: false, message: 'Pharmacy not found' });
    }

    pharmacy.status = 'rejected';
    pharmacy.rejectionReason = reason || null;
    await pharmacy.save();

    res.json({ success: true, message: 'Pharmacy registration rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Get All (admin) ───────────────────────────────────────────────────────────
exports.getAllPharmacies = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const pharmacies = await Pharmacy.find(filter, { password: 0 }).sort({ createdAt: -1 });
    res.json({ success: true, data: pharmacies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
