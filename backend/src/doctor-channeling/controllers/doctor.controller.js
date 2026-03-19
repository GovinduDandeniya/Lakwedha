const Doctor = require('../models/doctor.model');
const Availability = require('../models/availability.model');
const ClinicLocation = require('../models/clinicLocation.model');
const ChannelingSession = require('../models/channelingSession.model');
const RegisteredDoctor = require('../../models/RegisteredDoctor');
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

        // Search RegisteredDoctor first (portal-registered, approved doctors)
        let doctorId, doctorInfo;
        const regDoctor = await RegisteredDoctor.findOne({
            $or: [
                { fullName: { $regex: doctorName, $options: 'i' } },
                { firstName: { $regex: doctorName, $options: 'i' } },
            ],
            status: 'APPROVED',
        });

        if (regDoctor) {
            doctorId = regDoctor._id;
            doctorInfo = {
                id: regDoctor._id.toString(),
                name: regDoctor.fullName || `${regDoctor.firstName} ${regDoctor.lastName}`,
                specialization: regDoctor.specialization,
                qualification: null,
                is_verified: true,
            };
        } else {
            // Fall back to legacy channeling Doctor
            const doctor = await Doctor.findOne({ name: { $regex: doctorName, $options: 'i' } });
            if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });
            doctorId = doctor._id;
            doctorInfo = {
                id: doctor._id.toString(),
                name: doctor.name,
                specialization: doctor.specialization,
                qualification: doctor.qualification || null,
                is_verified: doctor.isVerified,
            };
        }

        // Read open sessions from ChannelingSession (created by the doctor portal)
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const channelings = await ChannelingSession.find({
            doctorId,
            date: { $gte: now },
            status: { $in: ['open', 'full'] },
        }).sort({ date: 1, hospitalName: 1 });

        // Group by hospital
        const hospitalMap = {};
        channelings.forEach(s => {
            const h = s.hospitalName;
            if (!hospitalMap[h]) {
                hospitalMap[h] = {
                    hospital_id: s._id.toString(),
                    hospital_name: h,
                    location: '',
                    sessions: [],
                };
            }
            hospitalMap[h].sessions.push({
                session_id: s._id.toString(),
                date: s.date.toISOString().split('T')[0],
                start_time: s.startTime,
                end_time: s.startTime,
                total_slots: s.totalAppointments,
                booked_slots: s.bookedCount,
            });
        });

        res.status(200).json({
            doctor: doctorInfo,
            hospitals: Object.values(hospitalMap),
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
