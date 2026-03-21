const RegisteredDoctor = require('../models/RegisteredDoctor');
const bcrypt = require('bcryptjs');

exports.getApprovedDoctors = async (req, res) => {
  try {
    const { specialty, q } = req.query;
    const filter = { status: 'APPROVED' };
    if (specialty) filter.specialization = { $regex: specialty, $options: 'i' };
    if (q) filter.$or = [
      { firstName: { $regex: q, $options: 'i' } },
      { lastName: { $regex: q, $options: 'i' } },
      { fullName: { $regex: q, $options: 'i' } },
    ];

    const doctors = await RegisteredDoctor.find(filter, { password: 0 });
    const formatted = doctors.map((d) => ({
      _id: d._id,
      name: d.fullName || `${d.title || ''} ${d.firstName || ''} ${d.lastName || ''}`.trim(),
      specialization: d.specialization,
      qualification: '',
      experience: 0,
      rating: 0,
      reviewCount: 0,
      profileImage: null,
      clinicName: d.hospitals?.[0]?.name || '',
      clinicAddress: d.hospitals?.[0]?.location || '',
      consultationFee: 0,
      isVerified: true,
    }));
    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveDoctor = async (req, res) => {
  try {
    const doctor = await RegisteredDoctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    doctor.status = 'APPROVED';
    await doctor.save();

    res.status(200).json({ message: 'Doctor approved successfully', doctor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.declineDoctor = async (req, res) => {
  try {
    const doctor = await RegisteredDoctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    doctor.status = 'DECLINED';
    doctor.declineReason = req.body.reason || null;
    await doctor.save();

    res.status(200).json({ message: 'Doctor declined', doctor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPendingDoctors = async (req, res) => {
  try {
    const doctors = await RegisteredDoctor.find({ status: 'PENDING' }, { password: 0 });
    res.status(200).json({ success: true, data: doctors });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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
      bankDetails,
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
      bankDetails: bankDetails || null,
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
