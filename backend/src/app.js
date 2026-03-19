const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

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

module.exports = app;
