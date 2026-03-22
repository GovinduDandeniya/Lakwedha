const mongoose = require('mongoose');
const User = require('./src/models/user');
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({});
    console.log('Users found:', users.map(u => ({ id: u._id, name: u.name, role: u.role })));
    await mongoose.disconnect();
}
check();
