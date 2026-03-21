const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const app = require('./app');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 5000;

if (!process.env.PAYHERE_MERCHANT_SECRET) {
    console.error('PAYHERE_MERCHANT_SECRET is missing from .env');
    process.exit(1);
}


mongoose
    .connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
        // useNewURLParser and useUnifiedTopology are deprecated in new Mongoose versions
        // but can be added if using older versions.
        // For production, consider connection pooling settings here.
    })
    .then(() => {
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is running internally on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });
