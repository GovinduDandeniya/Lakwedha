const express = require('express');
const router = express.Router();
const { register, login, changePassword } = require('../controllers/user.controller');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', auth, (req, res) => {
    res.json({
        message: 'Access granted',
        user: req.user,
    });
});
router.post('/change-password', auth, changePassword);

module.exports = router;
