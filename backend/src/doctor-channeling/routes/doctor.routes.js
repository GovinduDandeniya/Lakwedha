const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const { authMiddleware, roleMiddleware } = require('../../middleware/auth.middleware');

// Public routes
router.get('/specializations', doctorController.getSpecializations);
router.get('/', doctorController.searchDoctors);

// Doctor: get own hospitals from registration (must be before /:doctorId)
router.get('/me/hospitals', authMiddleware, roleMiddleware(['doctor']), doctorController.getMyHospitals);
router.post('/me/hospitals', authMiddleware, roleMiddleware(['doctor']), doctorController.addMyHospital);
router.delete('/me/hospitals/:index', authMiddleware, roleMiddleware(['doctor']), doctorController.removeMyHospital);

// Doctor: get and update own consultation fee (must be before /:doctorId)
router.get('/me/fee', authMiddleware, roleMiddleware(['doctor']), doctorController.getMyFee);
router.put('/me/fee', authMiddleware, roleMiddleware(['doctor']), doctorController.updateMyFee);

// Doctor: qualifications (must be before /:doctorId)
router.get('/me/qualifications',            authMiddleware, roleMiddleware(['doctor']), doctorController.getMyQualifications);
router.post('/me/qualifications',           authMiddleware, roleMiddleware(['doctor']), doctorController.addQualification);
router.delete('/me/qualifications/:qualId', authMiddleware, roleMiddleware(['doctor']), doctorController.deleteQualification);

router.get('/:doctorId', doctorController.getDoctorById);

module.exports = router;
