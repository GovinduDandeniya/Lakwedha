const express = require('express');
const router = express.Router();
const { register, login, getAllPharmacists } = require('../controllers/user.controller');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/pharmacies', getAllPharmacists); // Allow both users & guests to fetch list of pharmacies

// Protected route
router.get('/profile', auth, (req, res) => {
    res.json({
        message: 'Access granted',
        user: req.user, // info from JWT
    });
});

module.exports = router;
