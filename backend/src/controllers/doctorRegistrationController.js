const RegisteredDoctor = require('../models/RegisteredDoctor');
const bcrypt = require('bcryptjs');

exports.registerDoctor = async (req, res) => {
  try {
    const {
      title,
      firstName,
      lastName,
      fullName,
      email,
      mobile,
      nic,
      address,
      emergencyMobile,
      specialization,
      hospitals,
      password,
    } = req.body;

    const existingEmail = await RegisteredDoctor.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const existingNic = await RegisteredDoctor.findOne({ nic });
    if (existingNic) {
      return res.status(400).json({ message: 'NIC already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await RegisteredDoctor.create({
      title,
      firstName,
      lastName,
      fullName,
      email,
      mobile,
      nic,
      address,
      emergencyMobile,
      specialization,
      hospitals: Array.isArray(hospitals) ? hospitals : [],
      password: hashedPassword,
      status: 'PENDING',
    });

    res.status(201).json({
      message: 'Registration successful. Waiting for admin approval.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
