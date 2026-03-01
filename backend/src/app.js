const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

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

module.exports = app;
