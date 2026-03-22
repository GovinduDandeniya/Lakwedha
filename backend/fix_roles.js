const mongoose = require('mongoose');
const User = require('./src/models/user');
require('dotenv').config();

async function fixRoles() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Changing the last Admin to pharmacist for testing the dashboard
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
        console.log(`Setting ${admin.name} (${admin._id}) to pharmacist role.`);
        admin.role = 'pharmacist';
        await admin.save();
    }
    
    // Also setting John Doe to pharmacist if he exists
    const john = await User.findOne({ name: 'John Doe' });
    if (john) {
        console.log(`Setting John Doe (${john._id}) to pharmacist role.`);
        john.role = 'pharmacist';
        await john.save();
    }

    console.log('Role migration complete.');
    await mongoose.disconnect();
}

fixRoles().catch(console.error);
