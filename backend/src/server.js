const path = require('path');
<<<<<<< HEAD
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
=======
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
>>>>>>> origin/pharmacy
const app = require('./app');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 5000;

console.log('Starting server...');

mongoose
<<<<<<< HEAD
    .connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
=======
    .connect(process.env.MONGO_URI, {
>>>>>>> origin/pharmacy
        // useNewURLParser and useUnifiedTopology are deprecated in new Mongoose versions
        // but can be added if using older versions.
        // For production, consider connection pooling settings here.
    })
    .then(() => {
        console.log('MongoDB connected');
<<<<<<< HEAD
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT} at 0.0.0.0`);
=======
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
>>>>>>> origin/pharmacy
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });
