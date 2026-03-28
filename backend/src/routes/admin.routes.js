const express = require("express");
const router = express.Router();
const { login } = require("../controllers/admin.controller");
const verifyAdmin = require("../middleware/verifyAdmin");

// Public
router.all("/register", (req, res) => {
  return res.status(403).json({
    message: "System admin self-registration is disabled.",
  });
});
router.post("/login",    login);

// Example protected admin route — guards any downstream admin-only endpoints
// Usage: router.get("/profile", verifyAdmin, (req, res) => { ... });
router.get("/me", verifyAdmin, (req, res) => {
  res.json({ admin: req.admin });
});

module.exports = router;
