require('dotenv').config({ path: __dirname + '/../.env' }); // Adjust path if needed
const app = require('./app');
const mongoose = require('mongoose');

const getMongoUri = require('./config/getMongoUri');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('FATAL ERROR: MONGODB_URI is not defined in .env');
  process.exit(1);
}

// Connect to MongoDB using the SRV DNS Resolver bypass
getMongoUri().then(resolvedUri => {
    mongoose
      .connect(resolvedUri)
      .then(() => {
        console.log('Connected to MongoDB successfully.');

        app.listen(PORT, () => {
          console.log(`Server is running on port ${PORT}`);
        });
      })
      .catch((error) => {
        console.error('Database connection failed:', error.message);
        process.exit(1);
      });
}).catch(err => {
    console.error('Failed to resolve MONGO URI:', err);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});
