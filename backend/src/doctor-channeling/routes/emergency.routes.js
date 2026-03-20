const express = require('express');
const router = express.Router();
const emergencyController = require('../controllers/emergency.controller');
const { authMiddleware, roleMiddleware } = require('../../middleware/auth.middleware');

router.use(authMiddleware);

// Patient: submit a new emergency request
router.post('/', emergencyController.submitRequest);

// Patient: view their own requests (must come before '/' GET to avoid conflict)
router.get('/my', emergencyController.getMyRequests);

// Doctor: view emergency requests directed at them
router.get('/', roleMiddleware(['doctor']), emergencyController.getRequests);

// Doctor: approve or reject a request
router.patch('/:id/approve', roleMiddleware(['doctor']), emergencyController.approveRequest);
router.patch('/:id/reject', roleMiddleware(['doctor']), emergencyController.rejectRequest);

module.exports = router;
