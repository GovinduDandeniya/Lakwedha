const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/user.controller');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected route
router.get('/profile', auth, (req, res) => {
    res.json({
        message: 'Access granted',
        user: req.user, // info from JWT
    });
});

module.exports = router;
