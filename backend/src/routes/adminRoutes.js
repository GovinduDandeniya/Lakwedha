const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const admin = require('../controllers/adminController');

// All admin routes require authentication + admin role
router.use(auth, requireRole('admin'));

/* ── Doctors ── */
router.get('/doctors', admin.getDoctors);
router.put('/doctors/:id/approve', admin.approveDoctor);
router.put('/doctors/:id/reject', admin.rejectDoctor);

module.exports = router;
