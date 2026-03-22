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
    updateRequestStatus,
    getAllRequests,
    cancelRequest,
} = require('../controllers/pharmacyRequestController');

// Patient: find approved pharmacies by location (v1 alias used by mobile)
router.get('/nearby', auth, getNearbyPharmacies);

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
