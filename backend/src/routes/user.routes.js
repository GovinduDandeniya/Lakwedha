const express = require('express');
const router = express.Router();
const { register, login, changePassword, getAllPharmacists } = require('../controllers/user.controller');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/pharmacies', getAllPharmacists); // Allow both users & guests to fetch list of pharmacies

// Protected routes
router.get('/profile', auth, async (req, res) => {
    try {
        const User = require('../models/user');
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'Access granted', user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
router.post('/change-password', auth, changePassword);

module.exports = router;
