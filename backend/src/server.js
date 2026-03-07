const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const app = require('./app');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 5000;

console.log('Starting server...');

mongoose
    .connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
        // useNewURLParser and useUnifiedTopology are deprecated in new Mongoose versions
        // but can be added if using older versions.
        // For production, consider connection pooling settings here.
    })
    .then(() => {
        console.log('MongoDB connected');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });
