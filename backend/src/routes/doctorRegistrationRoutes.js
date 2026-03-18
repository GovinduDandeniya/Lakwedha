const express = require('express');
const { registerDoctor } = require('../controllers/doctorRegistrationController');

const router = express.Router();

router.post('/register', registerDoctor);

module.exports = router;
