const Doctor = require('../models/doctor.model');
const Availability = require('../models/availability.model');
const ClinicLocation = require('../models/clinicLocation.model');
const AYURVEDA_SPECIALIZATIONS = require('../constants/ayurvedaSpecializations');

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDoctor(d) {
    return {
        _id: d._id,
        name: d.name,
        specialization: d.specialization,
        qualification: d.qualification || '',
        experience: d.experience || 0,
        rating: d.rating || 0,
        reviewCount: d.reviewCount || 0,
        profileImage: d.profileImage || null,
        clinicName: d.clinicName || '',
        clinicAddress: d.clinicAddress || '',
        consultationFee: d.consultationFee || 0,
        isVerified: d.isVerified || false,
    };
}

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /doctor-channeling/specializations
 */
exports.getSpecializations = (req, res) => {
    res.status(200).json({ success: true, data: AYURVEDA_SPECIALIZATIONS });
};

/**
 * GET /doctor-channeling/doctors?q=&specialty=&hospital=&date=
 */
exports.searchDoctors = async (req, res) => {
    try {
        const { q, name, specialty, hospital, date } = req.query;
        const nameQuery = q || name;

        const filter = {};
        if (nameQuery) filter.name = { $regex: nameQuery, $options: 'i' };
        if (specialty) filter.specialization = { $regex: specialty, $options: 'i' };
        if (hospital) filter.clinicName = { $regex: hospital, $options: 'i' };

        if (date) {
            const targetDate = new Date(date);
            const nextDay = new Date(targetDate);
            nextDay.setDate(nextDay.getDate() + 1);
            const avails = await Availability.find({ date: { $gte: targetDate, $lt: nextDay } }).select('doctorId');
            const ids = avails.map(a => a.doctorId);
            if (ids.length === 0) return res.status(200).json({ success: true, data: [] });
            filter._id = { $in: ids };
        }

        const doctors = await Doctor.find(filter);
        res.status(200).json({ success: true, data: doctors.map(formatDoctor) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * GET /doctor-channeling/doctors/:doctorId
 */
exports.getDoctorById = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.doctorId);
        if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });
        res.status(200).json({ success: true, data: formatDoctor(doctor) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * GET /api/doctor-availability?doctorName=
 *
 * Response matches DoctorAvailabilityResult.fromJson in Flutter:
 * { doctor: { id, name, specialization, qualification, is_verified },
 *   hospitals: [{ hospital_id, hospital_name, location, sessions: [...] }] }
 */
exports.getDoctorAvailabilityByName = async (req, res) => {
    try {
        const { doctorName } = req.query;
        if (!doctorName) {
            return res.status(400).json({ success: false, error: 'doctorName is required' });
        }

        const doctor = await Doctor.findOne({ name: { $regex: doctorName, $options: 'i' } });
        if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });

        const clinic = doctor.clinicId ? await ClinicLocation.findById(doctor.clinicId) : null;

        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const availabilities = await Availability.find({ doctorId: doctor._id, date: { $gte: now } }).sort({ date: 1 });

        const sessions = availabilities.map(a => {
            const totalSlots = a.slots.length;
            const bookedSlots = a.slots.filter(s => s.status === 'booked' || s.isBooked).length;
            const first = a.slots[0];
            const last = a.slots[a.slots.length - 1];
            return {
                date: a.date.toISOString().split('T')[0],
                start_time: first ? first.startTime : '09:00',
                end_time: last ? last.endTime : '14:00',
                total_slots: totalSlots,
                booked_slots: bookedSlots,
            };
        });

        const hospitalName = (clinic && clinic.clinicName) || doctor.clinicName || 'Unknown Hospital';
        const location = clinic ? `${clinic.address}, ${clinic.city}` : (doctor.clinicAddress || '');
        const hospitalId = clinic ? clinic._id.toString() : `h_${doctor._id}`;

        res.status(200).json({
            doctor: { id: doctor._id.toString(), name: doctor.name, specialization: doctor.specialization, qualification: doctor.qualification || null, is_verified: doctor.isVerified },
            hospitals: sessions.length > 0 ? [{ hospital_id: hospitalId, hospital_name: hospitalName, location, sessions }] : [],
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
