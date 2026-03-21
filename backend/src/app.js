const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const app = express();

app.set('trust proxy', 1);

// Security Headers
app.use(helmet({ crossOriginResourcePolicy: false })); // allows serving static images cross-origin

// Rate Limiting to prevent brute-force attacks
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use(limiter);

app.use(cors());
app.use(express.json());

// Secure file access will be handled explicitly via authenticated routes.

const userRoutes = require('./routes/user.routes');
app.use('/api/users', userRoutes);

const forgotPasswordRoutes = require('./routes/forgotPassword.routes');
app.use('/api/forgot-password', forgotPasswordRoutes);

const registrationRoutes = require('./routes/registration.routes');
app.use('/api/auth', registrationRoutes);

const pharmacyRoutes = require('./routes/pharmacyRoutes');
app.use('/api/pharmacy', pharmacyRoutes);

const pharmacyRegistrationRoutes = require('./routes/pharmacyRegistrationRoutes');
app.use('/api/pharmacy-registration', pharmacyRegistrationRoutes);

const orderRoutes = require('./routes/orderRoutes');
app.use('/api/orders', orderRoutes);

const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

const emergencyCenterRoutes = require('./routes/emergencyCenterRoutes');
app.use('/api/emergency-centers', emergencyCenterRoutes);

const prescriptionRoutes = require('./routes/prescription.routes');
app.use("/api/prescriptions", prescriptionRoutes);

const emrRoutes = require('./routes/emr.routes');
app.use("/api/emr", emrRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    // Multer size limit error handling
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File is too large. Maximum size allows is 5MB.' });
    }

    return res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

module.exports = app;
