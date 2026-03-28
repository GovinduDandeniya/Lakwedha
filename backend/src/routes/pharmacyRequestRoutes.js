const express      = require('express');
const router       = express.Router();
const path         = require('path');
const fs           = require('fs');
const auth         = require('../middleware/auth');
const memoryUpload = require('../middleware/memoryUpload.middleware');
const { getNearbyPharmacies } = require('../controllers/pharmacyController');
const {
    createRequest,
    getPharmacyRequests,
    respondToRequest,
    getUserRequests,
    payForRequest,
    initiatePayForRequest,
    confirmPayForRequest,
    updateRequestStatus,
    getAllRequests,
    cancelRequest,
} = require('../controllers/pharmacyRequestController');

// Patient: find approved pharmacies by location — public, no auth required
router.get('/nearby', getNearbyPharmacies);

// Patient: upload prescription file (image or PDF)
router.post('/upload-prescription', auth, (req, res) => {
    memoryUpload.single('file')(req, res, (err) => {
        if (err) {
            console.error('[Upload] Multer error:', err.message);
            return res.status(400).json({ success: false, message: err.message || 'File upload error.' });
        }
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No file uploaded.' });
            }
            const uploadDir = path.join(__dirname, '../../uploads/prescriptions');
            fs.mkdirSync(uploadDir, { recursive: true });

            const ext      = (req.file.originalname.split('.').pop() || 'jpg').toLowerCase();
            const filename = `rx-${Date.now()}-${Math.floor(Math.random() * 1e9)}.${ext}`;
            fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer);

            const fileUrl = `/uploads/prescriptions/${filename}`;
            return res.status(201).json({ success: true, url: fileUrl });
        } catch (writeErr) {
            console.error('[Upload] Write error:', writeErr.message);
            return res.status(500).json({ success: false, message: 'Failed to save file: ' + writeErr.message });
        }
    });
});

// Patient: submit prescription request to pharmacies
router.post('/request', auth, createRequest);

// Patient: get own prescription requests
router.get('/my-requests', auth, getUserRequests);

// Patient: pay for an approved request
router.post('/pay', auth, payForRequest);
router.post('/pay/initiate', auth, initiatePayForRequest);
router.post('/pay/confirm', auth, confirmPayForRequest);

// PayHere redirect/webhook endpoints for pharmacy-request payments
router.get('/pay/return', (_req, res) => res.status(200).send('Payment complete.'));
router.get('/pay/cancel', (_req, res) => res.status(200).send('Payment cancelled.'));
router.post('/pay/notify', (_req, res) => res.status(200).send('OK'));

// Pharmacy: get requests for this pharmacy
router.get('/pharmacy-requests', auth, getPharmacyRequests);

// Pharmacy: approve (with price) or reject
router.post('/respond', auth, respondToRequest);

// Pharmacy: update order status (processing / completed)
router.put('/orders/:id/status', auth, updateRequestStatus);

// Admin: get all requests
router.get('/admin/all', auth, getAllRequests);

// Patient: cancel a pending request
router.delete('/request/:id', auth, cancelRequest);

module.exports = router;
