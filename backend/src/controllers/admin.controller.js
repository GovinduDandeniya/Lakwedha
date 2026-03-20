const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const SECRET_KEY = process.env.JWT_SECRET || "mysecretkey123";

// Validate Sri Lankan mobile number: +94XXXXXXXXX (9 digits after +94)
function isValidSLMobile(mobile) {
  return /^\+94\d{9}$/.test(mobile);
}

// Validate NIC: old format (9 digits + V/X) or new format (12 digits)
function isValidNIC(nic) {
  return /^\d{9}[VvXx]$/.test(nic) || /^\d{12}$/.test(nic);
}

/**
 * POST /api/admin/register
 */
exports.register = async (req, res) => {
  try {
    const { fullName, email, mobile, nic, password, confirmPassword } = req.body;

    // ── Field presence ────────────────────────────────────────────────────────
    if (!fullName || !email || !mobile || !nic || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // ── Email format ──────────────────────────────────────────────────────────
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    // ── Mobile format ─────────────────────────────────────────────────────────
    if (!isValidSLMobile(mobile)) {
      return res.status(400).json({ message: "Mobile must be a valid Sri Lankan number (+94XXXXXXXXX)." });
    }

    // ── NIC format ────────────────────────────────────────────────────────────
    if (!isValidNIC(nic)) {
      return res.status(400).json({ message: "Invalid NIC format. Use 9 digits + V/X or 12 digits." });
    }

    // ── Password rules ────────────────────────────────────────────────────────
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    // ── Unique email ──────────────────────────────────────────────────────────
    const existing = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: "An admin with this email already exists." });
    }

    // ── Hash & save ───────────────────────────────────────────────────────────
    const hashed = await bcrypt.hash(password, 12);
    const admin = new Admin({
      fullName: fullName.trim(),
      email:    email.toLowerCase().trim(),
      mobile,
      nic:      nic.trim(),
      password: hashed,
    });
    await admin.save();

    return res.status(201).json({ message: "Admin registered successfully." });
  } catch (err) {
    console.error("Admin register error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

/**
 * POST /api/admin/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (!admin.isActive) {
      return res.status(403).json({ message: "Account is inactive. Contact support." });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: "admin" },
      SECRET_KEY,
      { expiresIn: "8h" }
    );

    return res.json({
      token,
      admin: {
        id:    admin._id,
        email: admin.email,
        role:  "admin",
        name:  admin.fullName,
      },
    });
  } catch (err) {
    console.error("Admin login error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};
