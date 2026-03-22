const Doctor = require('../models/doctor.model');
const Availability = require('../models/availability.model');
const ClinicLocation = require('../models/clinicLocation.model');
const ChannelingSession = require('../models/channelingSession.model');
const RegisteredDoctor = require('../../models/RegisteredDoctor');
const Hospital = require('../../models/Hospital');
const AYURVEDA_SPECIALIZATIONS = require('../constants/ayurvedaSpecializations');

function formatRegisteredDoctor(d) {
    return {
        _id: d._id,
        name: d.fullName || `${d.firstName || ''} ${d.lastName || ''}`.trim(),
        specialization: d.specialization,
        qualification: null,
        experience: 0,
        rating: 0,
        reviewCount: 0,
        profileImage: null,
        clinicName: d.hospitals?.[0]?.name || '',
        clinicAddress: d.hospitals?.[0]?.location || '',
        consultationFee: 0,
        isVerified: true,
        isRegistered: true,
    };
}

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

const CHANNELING_RATE = 0.10; // 10% platform fee

/**
 * GET /doctor-channeling/specializations
 */
exports.getSpecializations = (req, res) => {
    res.status(200).json({ success: true, data: AYURVEDA_SPECIALIZATIONS });
};

/**
 * GET /api/v1/doctor-channeling/doctors/me/fee
 * Doctor: fetch own consultation fee
 */
exports.getMyHospitals = async (req, res) => {
    try {
        const doctor = await RegisteredDoctor.findById(req.user.id).select('hospitals');
        if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });
        res.json({ success: true, hospitals: doctor.hospitals || [] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * POST /api/v1/doctor-channeling/doctors/me/hospitals
 * Body: { name, location }
 * Doctor: add a new hospital/clinic to own profile
 */
exports.addMyHospital = async (req, res) => {
    try {
        const { name, location } = req.body;
        if (!name?.trim() || !location?.trim()) {
            return res.status(400).json({ success: false, error: 'Name and location are required' });
        }
        const doctor = await RegisteredDoctor.findByIdAndUpdate(
            req.user.id,
            { $push: { hospitals: { name: name.trim(), location: location.trim() } } },
            { new: true, select: 'hospitals' }
        );
        if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });

        // Sync new hospital into master Hospital collection (upsert by name, preserve admin fee)
        await Hospital.updateOne(
            { name: { $regex: `^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
            { $setOnInsert: { name: name.trim(), location: location.trim(), city: '', type: 'hospital', adminCharge: 0, isActive: true } },
            { upsert: true }
        );

        res.json({ success: true, hospitals: doctor.hospitals });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * DELETE /api/v1/doctor-channeling/doctors/me/hospitals/:index
 * Doctor: remove a hospital/clinic from own profile by array index
 */
exports.removeMyHospital = async (req, res) => {
    try {
        const index = parseInt(req.params.index, 10);
        const doctor = await RegisteredDoctor.findById(req.user.id).select('hospitals');
        if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });
        if (isNaN(index) || index < 0 || index >= doctor.hospitals.length) {
            return res.status(400).json({ success: false, error: 'Invalid hospital index' });
        }
        doctor.hospitals.splice(index, 1);
        await doctor.save();
        res.json({ success: true, hospitals: doctor.hospitals });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getMyFee = async (req, res) => {
    try {
        const doctor = await RegisteredDoctor.findById(req.user.id).select('consultationFee');
        if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });

        const upcomingSession = await ChannelingSession.findOne({
            doctorId: req.user.id,
            date: { $gte: new Date() },
            status: { $in: ['open', 'full'] },
        }).sort({ date: 1 }).select('hospitalCharge');

        res.json({
            success: true,
            consultationFee: doctor.consultationFee || 0,
            hospitalCharge: upcomingSession?.hospitalCharge || 0,
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * PUT /api/v1/doctor-channeling/doctors/me/fee
 * Body: { consultationFee: number }
 * Doctor: update own consultation fee
 */
exports.updateMyFee = async (req, res) => {
    try {
        const { consultationFee } = req.body;
        if (consultationFee === undefined || isNaN(Number(consultationFee)) || Number(consultationFee) < 0) {
            return res.status(400).json({ success: false, error: 'Invalid consultationFee value' });
        }
        const doctor = await RegisteredDoctor.findByIdAndUpdate(
            req.user.id,
            { consultationFee: Number(consultationFee) },
            { new: true }
        ).select('consultationFee');
        if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });
        res.json({ success: true, consultationFee: doctor.consultationFee });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * GET /api/v1/doctor-channeling/doctors/me/qualifications
 * Doctor: fetch own qualifications
 */
exports.getMyQualifications = async (req, res) => {
    try {
        const doctor = await RegisteredDoctor.findById(req.user.id).select('qualifications');
        if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });
        res.json({ success: true, data: doctor.qualifications || [] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * POST /api/v1/doctor-channeling/doctors/me/qualifications
 * Body: { type, title, institution, year }
 * Doctor: add a qualification entry
 */
exports.addQualification = async (req, res) => {
    try {
        const { type, title, institution, year } = req.body;
        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, error: 'title is required' });
        }
        const doctor = await RegisteredDoctor.findByIdAndUpdate(
            req.user.id,
            { $push: { qualifications: { type: type || 'education', title: title.trim(), institution: institution || '', year: year || '' } } },
            { new: true }
        ).select('qualifications');
        if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });
        res.status(201).json({ success: true, data: doctor.qualifications });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * DELETE /api/v1/doctor-channeling/doctors/me/qualifications/:qualId
 * Doctor: remove a qualification entry
 */
exports.deleteQualification = async (req, res) => {
    try {
        const doctor = await RegisteredDoctor.findByIdAndUpdate(
            req.user.id,
            { $pull: { qualifications: { _id: req.params.qualId } } },
            { new: true }
        ).select('qualifications');
        if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });
        res.json({ success: true, data: doctor.qualifications });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * GET /doctor-channeling/doctors?q=&specialty=&hospital=&date=
 */
exports.searchDoctors = async (req, res) => {
    try {
        const { q, name, specialty, hospital, date } = req.query;
        const nameQuery = q || name;

        // ── Legacy Doctor collection ───────────────────────────────────────────
        const legacyFilter = {};
        if (nameQuery) legacyFilter.name = { $regex: nameQuery, $options: 'i' };
        if (specialty) legacyFilter.specialization = { $regex: specialty, $options: 'i' };
        if (hospital) legacyFilter.clinicName = { $regex: hospital, $options: 'i' };

        if (date) {
            const targetDate = new Date(date);
            const nextDay = new Date(targetDate);
            nextDay.setDate(nextDay.getDate() + 1);
            const avails = await Availability.find({ date: { $gte: targetDate, $lt: nextDay } }).select('doctorId');
            const legacyIds = avails.map(a => a.doctorId);
            if (legacyIds.length > 0) legacyFilter._id = { $in: legacyIds };
            else legacyFilter._id = null; // no matches
        }

        const legacyDoctors = await Doctor.find(legacyFilter);

        // ── Portal RegisteredDoctor collection (APPROVED only) ────────────────
        const regFilter = { status: 'APPROVED' };
        if (nameQuery) {
            regFilter.$or = [
                { fullName:   { $regex: nameQuery, $options: 'i' } },
                { firstName:  { $regex: nameQuery, $options: 'i' } },
                { lastName:   { $regex: nameQuery, $options: 'i' } },
            ];
        }
        if (specialty) regFilter.specialization = { $regex: specialty, $options: 'i' };
        if (hospital) regFilter['hospitals.name'] = { $regex: hospital, $options: 'i' };

        if (date) {
            const targetDate = new Date(date);
            const nextDay = new Date(targetDate);
            nextDay.setDate(nextDay.getDate() + 1);
            const sessions = await ChannelingSession.find({
                date: { $gte: targetDate, $lt: nextDay },
                status: { $in: ['open', 'full'] },
            }).select('doctorId');
            const regIds = sessions.map(s => s.doctorId);
            if (regIds.length > 0) regFilter._id = { $in: regIds };
            else regFilter._id = null;
        }

        const registeredDoctors = await RegisteredDoctor.find(regFilter, { password: 0 });

        // ── Merge, deduplicating by _id ───────────────────────────────────────
        const seen = new Set();
        const merged = [];
        for (const d of legacyDoctors) {
            if (!seen.has(d._id.toString())) {
                seen.add(d._id.toString());
                merged.push(formatDoctor(d));
            }
        }
        for (const d of registeredDoctors) {
            if (!seen.has(d._id.toString())) {
                seen.add(d._id.toString());
                merged.push(formatRegisteredDoctor(d));
            }
        }

        res.status(200).json({ success: true, data: merged });
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
 * GET /api/v1/doctor-channeling/availability/doctor/:doctorId/summary
 *
 * Looks up a doctor by _id (RegisteredDoctor first, then legacy Doctor),
 * then returns their open/full ChannelingSession records in the shape
 * that DoctorAvailabilityResult.fromJson expects on the mobile app:
 * { success: true, data: { doctor: {...}, hospitals: [...] } }
 */
exports.getDoctorAvailabilityById = async (req, res) => {
    try {
        const { doctorId } = req.params;

        // RegisteredDoctor (portal-registered, APPROVED) takes priority
        let doctorInfo;
        const regDoctor = await RegisteredDoctor.findOne(
            { _id: doctorId, status: 'APPROVED' },
            { password: 0 }
        );
        if (regDoctor) {
            doctorInfo = {
                id: regDoctor._id.toString(),
                name: regDoctor.fullName || `${regDoctor.firstName} ${regDoctor.lastName}`,
                specialization: regDoctor.specialization,
                qualification: null,
                is_verified: true,
            };
        } else {
            const doctor = await Doctor.findById(doctorId);
            if (!doctor) {
                return res.status(404).json({ success: false, error: 'Doctor not found' });
            }
            doctorInfo = {
                id: doctor._id.toString(),
                name: doctor.name,
                specialization: doctor.specialization,
                qualification: doctor.qualification || null,
                is_verified: doctor.isVerified || false,
            };
        }

        // Fetch upcoming open/full channeling sessions created via the doctor portal
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sessions = await ChannelingSession.find({
            doctorId,
            date: { $gte: today },
            status: { $in: ['open', 'full'] },
        }).sort({ date: 1, startTime: 1 });

        // Group by hospital name; each session keeps its own session_id so the
        // mobile can book the exact session the doctor released.
        const hospitalMap = {};
        sessions.forEach(s => {
            const h = s.hospitalName;
            if (!hospitalMap[h]) {
                hospitalMap[h] = {
                    hospital_id: h,
                    hospital_name: h,
                    location: '',
                    sessions: [],
                };
            }
            const doctorFee     = regDoctor ? (regDoctor.consultationFee || 0) : 0;
        const hospCharge    = s.hospitalCharge || 0;
        const channelingFee = Math.round((doctorFee + hospCharge) * CHANNELING_RATE);
        const totalAmount   = doctorFee + hospCharge + channelingFee;

        hospitalMap[h].sessions.push({
                session_id:               s._id.toString(),
                date:                     s.date.toISOString().split('T')[0],
                start_time:               s.startTime,
                end_time:                 s.startTime,
                total_slots:              s.totalAppointments,
                booked_slots:             s.bookedCount,
                doctor_fee:               doctorFee,
                hospital_charge:          hospCharge,
                channeling_fee:           channelingFee,
                total_amount:             totalAmount,
                extra_requests_enabled:   s.extraRequestsEnabled || false,
            });
        });

        const doctorFeeBase = regDoctor ? (regDoctor.consultationFee || 0) : 0;

        res.json({
            success: true,
            data: {
                doctor:    { ...doctorInfo, consultationFee: doctorFeeBase },
                hospitals: Object.values(hospitalMap),
            },
        });
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
            const doctorFeeByName  = regDoctor ? (regDoctor.consultationFee || 0) : 0;
        const hospChargeByName = s.hospitalCharge || 0;
        const channelingFeeByName = Math.round((doctorFeeByName + hospChargeByName) * CHANNELING_RATE);
        const totalAmountByName   = doctorFeeByName + hospChargeByName + channelingFeeByName;

        hospitalMap[h].sessions.push({
                session_id:               s._id.toString(),
                date:                     s.date.toISOString().split('T')[0],
                start_time:               s.startTime,
                end_time:                 s.startTime,
                total_slots:              s.totalAppointments,
                booked_slots:             s.bookedCount,
                doctor_fee:               doctorFeeByName,
                hospital_charge:          hospChargeByName,
                channeling_fee:           channelingFeeByName,
                total_amount:             totalAmountByName,
                extra_requests_enabled:   s.extraRequestsEnabled || false,
            });
        });

        res.status(200).json({
            doctor: { ...doctorInfo, consultationFee: regDoctor ? (regDoctor.consultationFee || 0) : 0 },
            hospitals: Object.values(hospitalMap),
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
