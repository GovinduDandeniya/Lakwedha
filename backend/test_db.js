const mongoose = require('mongoose');
const uri = 'mongodb://127.0.0.1:27017/lakwedha';

console.log('Testing DB connection...');
mongoose.connect(uri)
    .then(() => {
        console.log('Connected!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Connection failed:', err);
        process.exit(1);
    });
