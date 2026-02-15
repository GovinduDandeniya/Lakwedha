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

/* ── Pharmacies ── */
router.get('/pharmacies', admin.getPharmacies);
router.put('/pharmacies/:id/approve', admin.approvePharmacy);
router.put('/pharmacies/:id/reject', admin.rejectPharmacy);

/* ── Patients / Users ── */
router.get('/patients', admin.getPatients);
router.put('/users/:id/suspend', admin.suspendUser);
router.put('/users/:id/activate', admin.activateUser);

/* ── Appointments ── */
router.get('/appointments', admin.getAppointments);

/* ── Orders ── */
router.get('/orders', admin.getOrders);

/* ── Analytics ── */
router.get('/analytics/overview', admin.getAnalyticsOverview);

module.exports = router;
