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

const pharmacyRoutes = require('./routes/pharmacyRoutes');
app.use('/api/pharmacy', pharmacyRoutes);

const orderRoutes = require('./routes/orderRoutes');
app.use('/api/orders', orderRoutes);

const prescriptionRoutes = require('./routes/prescription.routes');
app.use("/api/prescriptions", prescriptionRoutes);

const emrRoutes = require('./routes/emr.routes');
app.use("/api/emr", emrRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
module.exports = app;
