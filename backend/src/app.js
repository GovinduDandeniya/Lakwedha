const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('combined')); // Request logging

app.get('/', (req, res) => res.json({ message: 'Ayurveda Hub API is Live' }));
app.get('/api/health', (req, res) => res.json({ status: 'UP', timestamp: new Date() }));

const userRoutes = require('./routes/user.routes');
app.use('/api/users', userRoutes);

const pharmacyRoutes = require('./routes/pharmacyRoutes');
app.use('/api/pharmacy', pharmacyRoutes);

const orderRoutes = require('./routes/orderRoutes');
app.use('/api/orders', orderRoutes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
