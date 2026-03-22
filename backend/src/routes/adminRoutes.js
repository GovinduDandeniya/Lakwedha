const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const admin = require('../controllers/adminController');
const emergency = require('../controllers/emergencyController');
const hospital = require('../controllers/hospitalController');

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
router.delete('/users/:id', admin.deleteUser);

/* ── Appointments ── */
router.get('/appointments', admin.getAppointments);
router.put('/appointments/:id/cancel', admin.cancelAppointment);
router.post('/appointments/:id/approve-cancel', admin.approveCancellation);
router.post('/appointments/:id/reject-cancel', admin.rejectCancellation);
router.get('/channeling-sessions', admin.getChannelingSessions);
router.put('/channeling-sessions/:id/hospital-charge', admin.setSessionHospitalCharge);

/* ── Orders ── */
router.get('/orders', admin.getOrders);

/* ── Analytics ── */
router.get('/analytics/overview', admin.getAnalyticsOverview);

/* ── Hospitals / Clinics (admin CRUD) ── */
router.get('/hospitals', hospital.getAllHospitals);
router.post('/hospitals', hospital.createHospital);
router.put('/hospitals/:id', hospital.updateHospital);
router.delete('/hospitals/:id', hospital.deleteHospital);

/* ── Emergency Centers (admin CRUD) ── */
router.post('/emergency-centers', emergency.createCenter);
router.put('/emergency-centers/:id', emergency.updateCenter);
router.delete('/emergency-centers/:id', emergency.deleteCenter);

module.exports = router;
