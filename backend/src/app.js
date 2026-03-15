const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    // Allow all origins for dev (covers dynamic Flutter web ports like :12031)
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  credentials: true,
}));
app.use(express.json());
app.use(morgan('combined')); // Request logging

app.get('/', (req, res) => res.json({ success: true, data: null, message: 'Ayurveda Hub API is Live' }));
app.get('/api/health', (req, res) => res.json({ success: true, data: { status: 'UP', timestamp: new Date() }, message: 'API is healthy' }));

const userRoutes = require('./routes/user.routes');
app.use('/api/users', userRoutes);

const pharmacyRoutes = require('./routes/pharmacyRoutes');
app.use('/api/pharmacy', pharmacyRoutes);

const orderRoutes = require('./routes/orderRoutes');
app.use('/api/orders', orderRoutes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
