const mongoose = require('mongoose');
const Doctor = require('../models/doctor.model');
const Availability = require('../models/availability.model');
const ClinicLocation = require('../models/clinicLocation.model');
const AYURVEDA_SPECIALIZATIONS = require('../constants/ayurvedaSpecializations');

// ── Mock data (mirrors Flutter's _sampleDoctors in doctor_search_screen.dart) ─
const MOCK_DOCTORS = [
    { _id: 'd1', name: 'Dr. Kumari Jayawardena', specialization: 'General', qualification: 'BAMS, MD (Ayurveda)', experience: 12, rating: 4.8, reviewCount: 134, profileImage: null, clinicName: 'Nawaloka Hospital', clinicAddress: '23 Galle Rd, Colombo 02', consultationFee: 1500, isVerified: true },
    { _id: 'd2', name: 'Dr. Suresh Perera', specialization: 'Panchakarma', qualification: 'BAMS, PG Dip (Panchakarma)', experience: 9, rating: 4.6, reviewCount: 89, profileImage: null, clinicName: 'Asiri Hospital', clinicAddress: '181 Kirula Rd, Colombo 05', consultationFee: 2000, isVerified: true },
    { _id: 'd3', name: 'Dr. Malini Fernando', specialization: 'Skin Diseases', qualification: 'BAMS, MSc (Dermatology)', experience: 7, rating: 4.7, reviewCount: 112, profileImage: null, clinicName: 'Lanka Hospitals', clinicAddress: 'Narahenpita, Colombo 05', consultationFee: 1800, isVerified: true },
    { _id: 'd4', name: 'Dr. Rohan Wickramasinghe', specialization: 'Kadum Bidum', qualification: 'BAMS, Dip (Traumatology)', experience: 15, rating: 4.9, reviewCount: 201, profileImage: null, clinicName: 'Durdans Hospital', clinicAddress: '3 Alfred Place, Colombo 03', consultationFee: 2500, isVerified: true },
    { _id: 'd5', name: 'Dr. Priyanka Gunasekara', specialization: 'Sarpa Visha', qualification: 'BAMS, MD (Agada Tantra)', experience: 11, rating: 4.5, reviewCount: 76, profileImage: null, clinicName: 'Ninewells Hospital', clinicAddress: '55/1 Kirimandala Mawatha, Colombo 05', consultationFee: 2200, isVerified: false },
    { _id: 'd6', name: 'Dr. Amara Bandara', specialization: 'General', qualification: 'BAMS', experience: 5, rating: 4.3, reviewCount: 48, profileImage: null, clinicName: 'National Ayurveda Teaching Hospital', clinicAddress: 'Rajagiriya, Colombo', consultationFee: 800, isVerified: true },
    { _id: 'd7', name: 'Dr. Tharanga Ratnayake', specialization: 'Panchakarma', qualification: 'BAMS, MD (Kayachikitsa)', experience: 8, rating: 4.4, reviewCount: 63, profileImage: null, clinicName: 'Nawaloka Hospital', clinicAddress: '23 Galle Rd, Colombo 02', consultationFee: 1900, isVerified: false },
    { _id: 'd8', name: 'Dr. Nirosha Silva', specialization: 'Skin Diseases', qualification: 'BAMS, PG Cert (Cosmetic Ayurveda)', experience: 6, rating: 4.6, reviewCount: 95, profileImage: null, clinicName: 'Asiri Central Hospital', clinicAddress: '114 Norris Canal Rd, Colombo 10', consultationFee: 1700, isVerified: true },
];

// Pre-built availability (5 sessions per doctor, mix of available/limited/full)
const SESSION_BOOKED = [3, 8, 10, 2, 7];
const SESSION_DAY_OFFSETS = [1, 3, 5, 8, 12];

function makeMockSessions() {
    const now = new Date();
    return SESSION_DAY_OFFSETS.map((offset, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() + offset);
        const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return {
            date,
            start_time: '09:00',
            end_time: '14:00',
            total_slots: 10,
            booked_slots: SESSION_BOOKED[i],
        };
    });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isDbConnected() {
    return mongoose.connection.readyState === 1;
}

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

function filterMock(q, specialty, hospital) {
    return MOCK_DOCTORS.filter(d => {
        if (q && !d.name.toLowerCase().includes(q.toLowerCase())) return false;
        if (specialty && !d.specialization.toLowerCase().includes(specialty.toLowerCase())) return false;
        if (hospital && !d.clinicName.toLowerCase().includes(hospital.toLowerCase())) return false;
        return true;
    });
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

        if (!isDbConnected()) {
            return res.status(200).json({ success: true, data: filterMock(nameQuery, specialty, hospital) });
        }

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
        if (!isDbConnected()) {
            const doc = MOCK_DOCTORS.find(d => d._id === req.params.doctorId);
            if (!doc) return res.status(404).json({ success: false, error: 'Doctor not found' });
            return res.status(200).json({ success: true, data: doc });
        }

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

        if (!isDbConnected()) {
            const doc = MOCK_DOCTORS.find(d => d.name.toLowerCase().includes(doctorName.toLowerCase()));
            if (!doc) return res.status(404).json({ success: false, error: 'Doctor not found' });
            return res.status(200).json({
                doctor: { id: doc._id, name: doc.name, specialization: doc.specialization, qualification: doc.qualification, is_verified: doc.isVerified },
                hospitals: [{
                    hospital_id: `h_${doc._id}`,
                    hospital_name: doc.clinicName,
                    location: doc.clinicAddress,
                    sessions: makeMockSessions(),
                }],
            });
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
