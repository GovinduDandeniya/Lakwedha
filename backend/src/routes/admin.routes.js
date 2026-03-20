const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/admin.controller");
const verifyAdmin = require("../middleware/verifyAdmin");

// Public
router.post("/register", register);
router.post("/login",    login);

// Example protected admin route — guards any downstream admin-only endpoints
// Usage: router.get("/profile", verifyAdmin, (req, res) => { ... });
router.get("/me", verifyAdmin, (req, res) => {
  res.json({ admin: req.admin });
});

module.exports = router;
