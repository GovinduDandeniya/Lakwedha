const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
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

app.use(cors({
  origin: (origin, callback) => {
    // Allow all origins for dev (covers dynamic Flutter web ports like :12031)
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  credentials: true,
}));
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true })); // needed for PayHere notifications
app.use(morgan('combined')); // Request logging

// Basic health routes for quick API checks from browser/tools
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Lakwedha backend is running' });
});

app.get('/api', (req, res) => {
  res.json({ success: true, message: 'Lakwedha API root' });
});

app.get('/api/v1', (req, res) => {
  res.json({ success: true, message: 'Lakwedha API v1 root' });
});

// Serve uploaded files (prescriptions, etc.) as static assets
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const userRoutes = require('./routes/user.routes');
app.use('/api/users', userRoutes);

const forgotPasswordRoutes = require('./routes/forgotPassword.routes');
app.use('/api/forgot-password', forgotPasswordRoutes);

const registrationRoutes = require('./routes/registration.routes');
app.use('/api/auth', registrationRoutes);

const pharmacyRoutes = require('./routes/pharmacyRoutes');
app.use('/api/pharmacy', pharmacyRoutes);

const pharmacyRequestRoutes = require('./routes/pharmacyRequestRoutes');
app.use('/api/v1/pharmacy', pharmacyRequestRoutes);

const pharmacyRegistrationRoutes = require('./routes/pharmacyRegistrationRoutes');
app.use('/api/pharmacy-registration', pharmacyRegistrationRoutes);

const orderRoutes = require('./routes/orderRoutes');
app.use('/api/orders', orderRoutes);

const medicineRoutes = require('./routes/medicineRoutes');
app.use('/api/medicines', medicineRoutes);

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
