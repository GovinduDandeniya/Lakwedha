const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Override system DNS with Google DNS — local DNS doesn't support MongoDB Atlas SRV/A records
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const cors = require("cors");

const doctorChannelingRouter = require("./doctor-channeling/index");
const doctorController = require("./doctor-channeling/controllers/doctor.controller");
const Appointment = require("./doctor-channeling/models/appointment.model");
const Patient = require("./models/patient.model");
const Doctor = require("./doctor-channeling/models/doctor.model");
const RegisteredDoctor = require("./models/RegisteredDoctor");
const ChannelingSession = require("./doctor-channeling/models/channelingSession.model");
const Hospital = require("./models/Hospital");
const User = require("./models/user");
const Notification = require("./models/Notification");
const notificationService = require("./doctor-channeling/services/notification.service");
require("./jobs/reminderJob");

// ── Route imports ─────────────────────────────────────────────────────────────
const userRoutes                  = require("./routes/user.routes");
const forgotPasswordRoutes        = require("./routes/forgotPassword.routes");
const registrationRoutes          = require("./routes/registration.routes");
const doctorRegistrationRoutes    = require("./routes/doctorRegistrationRoutes");
const pharmacyRegistrationRoutes  = require("./routes/pharmacyRegistrationRoutes");
const pharmacyOperationsRoutes    = require("./routes/pharmacyRoutes");   // prescription management
const pharmacyRequestRoutes       = require("./routes/pharmacyRequestRoutes");
const orderRoutes                 = require("./routes/orderRoutes");       // order lifecycle
const adminRoutes                 = require("./routes/admin.routes");      // admin auth (login/register)
const adminManagementRoutes       = require("./routes/adminRoutes");        // admin dashboard (analytics, doctors, etc.)
const otpRoutes                   = require("./routes/otpRoutes");
const notificationAppointmentRoutes = require("./routes/notificationAppointmentRoutes");
const requestLogger               = require("./middleware/requestLogger");
const errorHandler                = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(requestLogger);

// ── MongoDB ───────────────────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("ERROR: MONGODB_URI environment variable is not set.");
  process.exit(1);
}
mongoose.connect(MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => { console.error("MongoDB connection error:", err); process.exit(1); });

// ── Auth ─────────────────────────────────────────────────────────────────────
const SECRET_KEY = process.env.JWT_SECRET || "mysecretkey123";

// Inline JWT auth middleware used by channeling-session routes
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ success: false, error: 'No token provided' });
  try {
    req.user = jwt.verify(header.split(' ')[1], SECRET_KEY);
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

// Legacy login (username-based) — looks up doctor by name in DB
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await Doctor.findOne({ name: { $regex: username, $options: 'i' }, email: { $exists: true } });
    if (!user) return res.status(404).send("User not found");
    if (!bcrypt.compareSync(password, user.password)) return res.status(401).send("Invalid password");
    const token = jwt.sign({ id: user._id, email: user.email, role: "doctor" }, SECRET_KEY, { expiresIn: "1h" });
    res.send({ message: "Login successful", token });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// Doctor portal login (email-based) — checks RegisteredDoctor first, then legacy Doctor
app.post("/api/v1/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    // Check new registration model first
    const registered = await RegisteredDoctor.findOne({ email: email?.toLowerCase().trim() });
    if (registered) {
      if (!bcrypt.compareSync(password, registered.password)) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      if (registered.status === "PENDING") {
        return res.status(403).json({
          message: "Account pending approval",
          status: "PENDING",
        });
      }
      if (registered.status === "DECLINED") {
        return res.status(403).json({
          message: "Registration declined",
          status: "DECLINED",
          reason: registered.declineReason,
        });
      }
      // APPROVED
      const token = jwt.sign(
        { id: registered._id, email: registered.email, role: "doctor" },
        SECRET_KEY,
        { expiresIn: "8h" }
      );
      return res.json({
        token,
        status: "APPROVED",
        user: {
          id: registered._id,
          name: registered.fullName || `${registered.firstName} ${registered.lastName}`,
          email: registered.email,
          role: "doctor",
          specialization: registered.specialization,
          qualifications: registered.qualifications || [],
          qualification: Array.isArray(registered.qualifications)
            ? registered.qualifications.map((q) => q?.title).filter(Boolean).join(', ')
            : '',
          status: "APPROVED",
        },
      });
    }

    // Fall back to legacy channeling Doctor model
    const user = await Doctor.findOne({ email });
    if (!user || !user.password) return res.status(401).json({ message: "Invalid email or password" });
    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ message: "Invalid email or password" });
    const token = jwt.sign({ id: user._id, email: user.email, role: "doctor" }, SECRET_KEY, { expiresIn: "8h" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: "doctor", specialization: user.specialization } });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Token verification
app.get("/api/v1/auth/verify", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.json({ valid: false });
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    // Check new RegisteredDoctor model first, then fall back to legacy Doctor
    const registered = await RegisteredDoctor.findById(decoded.id);
    if (registered) {
      return res.json({
        valid: true,
        user: {
          id: registered._id,
          name: registered.fullName || `${registered.firstName} ${registered.lastName}`,
          email: registered.email,
          role: "doctor",
          specialization: registered.specialization,
          qualifications: registered.qualifications || [],
          qualification: Array.isArray(registered.qualifications)
            ? registered.qualifications.map((q) => q?.title).filter(Boolean).join(', ')
            : '',
          status: registered.status,
        },
      });
    }
    const user = await Doctor.findById(decoded.id);
    if (!user) return res.json({ valid: false });
    res.json({ valid: true, user: { id: user._id, name: user.name, email: user.email, role: "doctor", specialization: user.specialization } });
  } catch {
    res.json({ valid: false });
  }
});

// ── Appointments ──────────────────────────────────────────────────────────────
app.get("/api/v1/appointments", requireAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { doctorId: req.user.id };
    if (status && status !== 'all') filter.status = status;

    const appointments = await Appointment.find(filter)
      .populate('patientId', 'name title first_name last_name birthday gender')
      .sort({ slotTime: -1 });

    // Transform to flat structure expected by the doctor portal UI
    const data = appointments.map(a => {
      const p = a.patientId;
      let patientAge = null;
      if (p?.birthday) {
        const ms = Date.now() - new Date(p.birthday).getTime();
        patientAge = Math.floor(ms / (365.25 * 24 * 60 * 60 * 1000));
      }
      const firstName = p?.first_name || null;
      const lastName  = p?.last_name  || null;
      return {
        id:               a._id,
        appointmentId:    a.appointmentId,
        status:           a.status,
        slotTime:         a.slotTime,
        date:             a.slotTime ? a.slotTime.toISOString().split('T')[0] : null,
        hospital:         a.hospitalName || null,
        appointmentNumber: a.appointmentNumber || null,
        symptoms:         a.symptoms || null,
        patientId:        p?._id || a.patientId,
        patientName:      p?.name || null,
        patientTitle:     p?.title || null,
        patientFirstName: firstName,
        patientLastName:  lastName,
        patientDisplayName: p
          ? (p.name || `${firstName || ''} ${lastName || ''}`.trim() || null)
          : null,
        patientAge,
        patientGender:    p?.gender || null,
      };
    });

    res.json({ success: true, data, total: data.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch("/api/v1/appointments/:id/complete", async (req, res) => {
  try {
    await Appointment.findByIdAndUpdate(req.params.id, { status: 'completed', updatedAt: new Date() });
    res.json({ success: true, message: 'Appointment marked as completed' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Patients ──────────────────────────────────────────────────────────────────
app.get("/api/v1/patients", requireAuth, async (req, res) => {
  try {
    const { search } = req.query;

    // Get all appointments for this doctor to build patient stats
    const appointments = await Appointment.find({ doctorId: req.user.id })
      .select('patientId slotTime status')
      .sort({ slotTime: -1 });

    // Aggregate: unique patientIds with visit count (completed only) and last visit date
    const statsMap = {};
    for (const a of appointments) {
      const pid = a.patientId?.toString();
      if (!pid) continue;
      // Always register the patient (they booked), but only count completed as a visit
      if (!statsMap[pid]) {
        statsMap[pid] = { totalVisits: 0, lastVisit: null };
      }
      if (a.status === 'completed') {
        statsMap[pid].totalVisits += 1;
        if (!statsMap[pid].lastVisit && a.slotTime) {
          statsMap[pid].lastVisit = a.slotTime.toISOString().split('T')[0];
        }
      }
    }

    const patientIds = Object.keys(statsMap);
    if (patientIds.length === 0) {
      return res.json({ success: true, data: [], total: 0 });
    }

    // Fetch User records for these patients
    const userFilter = { _id: { $in: patientIds } };
    if (search) {
      userFilter.$or = [
        { name:       { $regex: search, $options: 'i' } },
        { first_name: { $regex: search, $options: 'i' } },
        { last_name:  { $regex: search, $options: 'i' } },
      ];
    }
    const users = await User.find(userFilter, {
      password: 0, otp_code: 0, otp_expiry: 0,
    });

    // Build response in the shape PatientList expects
    const data = users.map(u => {
      const stats = statsMap[u._id.toString()] || { totalVisits: 0, lastVisit: null };
      let age = null;
      if (u.birthday) {
        const ms = Date.now() - new Date(u.birthday).getTime();
        age = Math.floor(ms / (365.25 * 24 * 60 * 60 * 1000));
      }
      return {
        id:          u._id,
        name:        u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || null,
        title:       u.title || null,
        firstName:   u.first_name || null,
        lastName:    u.last_name  || null,
        email:       u.email || null,
        phone:       u.phone || null,
        gender:      u.gender || null,
        age,
        totalVisits: stats.totalVisits,
        lastVisit:   stats.lastVisit,
      };
    });

    res.json({ success: true, data, total: data.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/v1/patients/:id/history", async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.params.id }).sort({ slotTime: -1 });
    res.json({ success: true, data: appointments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Dashboard ─────────────────────────────────────────────────────────────────

function transformAppointment(a) {
  const p = a.patientId;
  let patientAge = null;
  if (p?.birthday) {
    const ms = Date.now() - new Date(p.birthday).getTime();
    patientAge = Math.floor(ms / (365.25 * 24 * 60 * 60 * 1000));
  }
  const firstName = p?.first_name || null;
  const lastName  = p?.last_name  || null;
  return {
    id:                a._id,
    appointmentId:     a.appointmentId,
    status:            a.status,
    slotTime:          a.slotTime,
    date:              a.slotTime ? a.slotTime.toISOString().split('T')[0] : null,
    time:              a.slotTime ? a.slotTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
    hospital:          a.hospitalName || null,
    appointmentNumber: a.appointmentNumber || null,
    symptoms:          a.symptoms || null,
    patientId:         p?._id || a.patientId,
    patientName:       p?.name || null,
    patientTitle:      p?.title || null,
    patientFirstName:  firstName,
    patientLastName:   lastName,
    patientDisplayName: p
      ? (p.name || `${firstName || ''} ${lastName || ''}`.trim() || null)
      : null,
    patientAge,
    patientGender:     p?.gender || null,
  };
}

app.get("/api/v1/dashboard/stats", requireAuth, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const doctorFilter = { doctorId: req.user.id };

    const [todayApts, totalPatients] = await Promise.all([
      Appointment.find({ ...doctorFilter, slotTime: { $gte: today, $lt: tomorrow } }),
      Patient.countDocuments(),
    ]);

    const upcoming = await Appointment.countDocuments({
      ...doctorFilter,
      slotTime: { $gte: tomorrow },
      status: { $in: ['pending', 'confirmed'] },
    });

    res.json({
      todayAppointments: todayApts.length,
      completedToday: todayApts.filter(a => a.status === 'completed').length,
      pendingToday: todayApts.filter(a => a.status === 'pending').length,
      upcomingAppointments: upcoming,
      totalPatients,
      earningsToday: 0,
      earningsMonth: 0,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/v1/dashboard/today-appointments", requireAuth, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const appointments = await Appointment.find({
      doctorId: req.user.id,
      slotTime: { $gte: today, $lt: tomorrow },
    })
      .populate('patientId', 'name title first_name last_name birthday gender')
      .sort({ hospitalName: 1, appointmentNumber: 1 });
    res.json({ success: true, data: appointments.map(transformAppointment) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch("/api/v1/dashboard/appointments/:id/complete", requireAuth, async (req, res) => {
  try {
    await Appointment.findByIdAndUpdate(req.params.id, { status: 'completed', updatedAt: new Date() });
    res.json({ success: true, message: 'Appointment marked as completed' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/v1/dashboard/upcoming", requireAuth, async (req, res) => {
  try {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(0, 0, 0, 0);
    const weekLater = new Date(tomorrow); weekLater.setDate(weekLater.getDate() + 7);
    const appointments = await Appointment.find({
      doctorId: req.user.id,
      slotTime: { $gte: tomorrow, $lt: weekLater },
      status: { $in: ['pending', 'confirmed'] },
    })
      .populate('patientId', 'name title first_name last_name birthday gender')
      .sort({ slotTime: 1 })
      .limit(20);
    res.json({ success: true, data: appointments.map(transformAppointment) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/v1/dashboard/notifications", (_, res) => {
  // Notifications are generated from session-cancel events; see patientNotifications below.
  res.json({ success: true, data: [], unreadCount: 0 });
});

app.get("/api/v1/dashboard/earnings", (_, res) => {
  // Earnings calculation is not yet implemented.
  res.json({ success: true, data: { doctorFee: 0, channelingFee: 0, totalToday: 0, totalMonth: 0, weeklyTrend: [0, 0, 0, 0, 0, 0, 0], weekDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] } });
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return 0;
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}
const CANCEL_LEAD_MINUTES = 12 * 60; // 12 hours

// Session info: hospitals for a date with 10-hour-rule status
app.get("/api/v1/dashboard/session-info", async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().slice(0, 10);
    const start = new Date(targetDate); start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate); end.setHours(23, 59, 59, 999);

    const activeApts = await Appointment.find({
      slotTime: { $gte: start, $lte: end },
      status: { $nin: ['cancelled', 'completed'] },
    }).populate('slotId');

    if (activeApts.length === 0) {
      return res.json({ success: true, date: targetDate, hospitals: [] });
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const isFutureDate = targetDate > todayStr;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    // Group by hospitalName (stored on appointment or populate from slot)
    const hospitalMap = {};
    activeApts.forEach(a => {
      const h = a.hospitalName || 'Unknown Hospital';
      if (!hospitalMap[h]) hospitalMap[h] = [];
      hospitalMap[h].push(a);
    });

    const hospitals = Object.entries(hospitalMap).map(([name, apts]) => {
      const times = apts.map(a => {
        const t = new Date(a.slotTime);
        return t.getHours() * 60 + t.getMinutes();
      });
      const earliestMinutes = Math.min(...times);
      const minutesUntilSession = isFutureDate ? Infinity : earliestMinutes - nowMinutes;
      const canCancel = isFutureDate || minutesUntilSession > CANCEL_LEAD_MINUTES;
      return {
        name,
        earliestTime: apts[0] ? new Date(apts[0].slotTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
        appointmentCount: apts.length,
        canCancel,
        minutesUntilDeadline: isFutureDate ? null : minutesUntilSession - CANCEL_LEAD_MINUTES,
      };
    });

    res.json({ success: true, date: targetDate, hospitals });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Patient notifications ─────────────────────────────────────────────────────

// Cancel a session — updates DB and notifies affected patients
app.post("/api/v1/dashboard/cancel-session", async (req, res) => {
  try {
    const { date, reason, hospital } = req.body;
    const targetDate = date || new Date().toISOString().slice(0, 10);
    const todayStr = new Date().toISOString().slice(0, 10);

    const start = new Date(targetDate); start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate); end.setHours(23, 59, 59, 999);

    const filter = {
      slotTime: { $gte: start, $lte: end },
      status: { $nin: ['cancelled', 'completed'] },
    };
    if (hospital && hospital !== 'ALL') filter.hospitalName = hospital;

    const toCancel = await Appointment.find(filter).populate('patientId', 'name');

    if (toCancel.length === 0) {
      return res.status(400).json({ success: false, error: 'No active appointments found for the selected date/hospital.' });
    }

    // Validate 10-hour rule for today
    if (targetDate === todayStr) {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const byHospital = {};
      toCancel.forEach(a => {
        const h = a.hospitalName || 'Unknown Hospital';
        if (!byHospital[h]) byHospital[h] = [];
        byHospital[h].push(a);
      });
      for (const [hName, hApts] of Object.entries(byHospital)) {
        const times = hApts.map(a => { const t = new Date(a.slotTime); return t.getHours() * 60 + t.getMinutes(); });
        const earliest = Math.min(...times);
        if (earliest - nowMinutes <= CANCEL_LEAD_MINUTES) {
          const startTimeStr = new Date(hApts.find(a => { const t = new Date(a.slotTime); return t.getHours() * 60 + t.getMinutes() === earliest; })?.slotTime)
            .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          return res.status(400).json({
            success: false,
            error: `Cannot cancel ${hName} — less than 12 hours until session starts (${startTimeStr}).`,
          });
        }
      }
    }

    // Mark cancelled in DB
    const ids = toCancel.map(a => a._id);
    await Appointment.updateMany({ _id: { $in: ids } }, { status: 'cancelled', cancellationReason: reason || null, updatedAt: new Date() });

    // Mark matching ChannelingSession(s) as cancelled and record 6% cancellation charge
    const CHANNELING_RATE = 0.10;
    const CANCELLATION_CHARGE_RATE = 0.06;
    const affectedDoctorIds = [...new Set(toCancel.map(a => a.doctorId?.toString()).filter(Boolean))];
    for (const dId of affectedDoctorIds) {
      const doc = await RegisteredDoctor.findById(dId).select('consultationFee');
      const doctorFee = doc?.consultationFee || 0;
      // Find active ChannelingSession(s) for this doctor/date/hospital and mark as cancelled
      const sessionFilter = { doctorId: dId, date: { $gte: start, $lte: end }, status: { $in: ['open', 'full', 'closed'] } };
      if (hospital && hospital !== 'ALL') sessionFilter.hospitalName = hospital;
      const affectedSessions = await ChannelingSession.find(sessionFilter);
      for (const sess of affectedSessions) {
        const hospCharge = sess.hospitalCharge || 0;
        const channelingFeePerApt = Math.round((doctorFee + hospCharge) * CHANNELING_RATE);
        const chargePerApt = Math.round(channelingFeePerApt * CANCELLATION_CHARGE_RATE);
        sess.status = 'cancelled';
        sess.cancellationCharge = chargePerApt * sess.bookedCount;
        sess.updatedAt = new Date();
        await sess.save();
      }
    }

    // Build patient notifications
    const formattedDate = new Date(targetDate).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const hospitalLabel = (hospital && hospital !== 'ALL') ? ` at ${hospital}` : '';
    const notifMessage = reason
      ? `Your appointment${hospitalLabel} on ${formattedDate} has been cancelled by the doctor. Reason: ${reason}. We apologise for the inconvenience.`
      : `Your appointment${hospitalLabel} on ${formattedDate} has been cancelled by the doctor. We apologise for the inconvenience.`;

    const created = await Promise.all(toCancel.map(async (a) => {
      const userId = a.patientId?._id || a.patientId;
      // Persist to DB
      const dbNotif = await Notification.create({
        userId,
        title: 'Session Cancelled',
        message: notifMessage,
        type: 'SESSION_CANCELLED',
        appointmentId: a._id,
      });
      // Send push (non-blocking)
      User.findById(userId).select('fcmToken').then(u => {
        if (u?.fcmToken) {
          const { sendPushNotification } = require('./utils/sendNotification');
          sendPushNotification(u.fcmToken, 'Session Cancelled', notifMessage).catch(() => {});
        }
      }).catch(() => {});
      return dbNotif;
    }));

    res.json({
      success: true,
      message: `Session cancelled. ${created.length} patient(s) notified.`,
      affectedCount: created.length,
      date: targetDate,
      hospital: hospital || 'ALL',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Patient: get their notifications (DB-backed, auth-protected)
app.get("/api/v1/patient-notifications", requireAuth, async (req, res) => {
  try {
    const data = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, data, unreadCount: data.filter(n => !n.read).length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Patient: mark all notifications as read (must be before /:id routes to avoid conflicts)
app.patch("/api/v1/patient-notifications/read-all", requireAuth, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Patient: mark a single notification as read
app.patch("/api/v1/patient-notifications/:id/read", requireAuth, async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Patient: delete a single notification
app.delete("/api/v1/patient-notifications/:id", requireAuth, async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Channeling Sessions (Availability Management) ────────────────────────────

// Release a new channeling session
app.post('/api/v1/channeling-sessions', requireAuth, async (req, res) => {
  try {
    const { hospitalName, date, startTime, totalAppointments, note } = req.body;

    if (!hospitalName || !date || !startTime || !totalAppointments) {
      return res.status(400).json({ success: false, error: 'hospitalName, date, startTime, and totalAppointments are required' });
    }
    if (Number(totalAppointments) < 1) {
      return res.status(400).json({ success: false, error: 'totalAppointments must be at least 1' });
    }

    const sessionDate = new Date(date);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (sessionDate < today) {
      return res.status(400).json({ success: false, error: 'Cannot release sessions for past dates' });
    }

    const existing = await ChannelingSession.findOne({
      doctorId: req.user.id,
      hospitalName: { $regex: `^${hospitalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
      date: sessionDate,
      startTime,
    });
    if (existing) {
      return res.status(409).json({ success: false, error: 'A session already exists for this hospital, date, and time' });
    }

    // Auto-fill hospital charge from the master Hospital record set by admin
    const masterHospital = await Hospital.findOne({
      name: { $regex: `^${hospitalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
      isActive: true,
    });

    const session = new ChannelingSession({
      doctorId: req.user.id,
      hospitalName,
      date: sessionDate,
      startTime,
      totalAppointments: parseInt(totalAppointments),
      note: note || '',
      hospitalCharge: masterHospital ? masterHospital.adminCharge : 0,
    });
    await session.save();

    res.status(201).json({ success: true, data: session, message: 'Appointments released successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all sessions for the authenticated doctor
app.get('/api/v1/channeling-sessions', requireAuth, async (req, res) => {
  try {
    const { fromDate, toDate, status, hospital } = req.query;
    const filter = { doctorId: req.user.id };

    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) { const d = new Date(toDate); d.setHours(23, 59, 59, 999); filter.date.$lte = d; }
    }
    if (status && status !== 'all') filter.status = status;
    if (hospital) filter.hospitalName = { $regex: hospital, $options: 'i' };

    const sessions = await ChannelingSession.find(filter).sort({ date: 1, startTime: 1 });
    res.json({ success: true, data: sessions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Edit a session
app.patch('/api/v1/channeling-sessions/:id', requireAuth, async (req, res) => {
  try {
    const session = await ChannelingSession.findOne({ _id: req.params.id, doctorId: req.user.id });
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
    if (['cancelled', 'completed'].includes(session.status)) {
      return res.status(400).json({ success: false, error: `Cannot edit a ${session.status} session` });
    }

    const { hospitalName, startTime, totalAppointments, note } = req.body;
    if (hospitalName) session.hospitalName = hospitalName;
    if (startTime) session.startTime = startTime;
    if (totalAppointments !== undefined) {
      if (parseInt(totalAppointments) < session.bookedCount) {
        return res.status(400).json({ success: false, error: `Cannot reduce appointments below booked count (${session.bookedCount})` });
      }
      session.totalAppointments = parseInt(totalAppointments);
    }
    if (note !== undefined) session.note = note;

    // Auto-sync status
    if (session.bookedCount >= session.totalAppointments && session.status === 'open') session.status = 'full';
    else if (session.bookedCount < session.totalAppointments && session.status === 'full') session.status = 'open';

    session.updatedAt = new Date();
    await session.save();

    res.json({ success: true, data: session, message: 'Session updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Cancel a session — also cancels all booked appointments for that session
app.patch('/api/v1/channeling-sessions/:id/cancel', requireAuth, async (req, res) => {
  try {
    const session = await ChannelingSession.findOne({ _id: req.params.id, doctorId: req.user.id });
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
    if (session.status === 'cancelled') return res.status(400).json({ success: false, error: 'Session is already cancelled' });

    // Build the slotTime for this session (date + startTime)
    const [startHour, startMin] = session.startTime.split(':').map(Number);
    const slotTime = new Date(session.date);
    slotTime.setHours(startHour, startMin, 0, 0);

    // Cancel all appointments linked to this session
    const slotWindowStart = new Date(slotTime.getTime() - 60000); // ±1 min tolerance
    const slotWindowEnd   = new Date(slotTime.getTime() + 60000);
    const { modifiedCount } = await Appointment.updateMany(
      {
        doctorId: session.doctorId,
        slotTime: { $gte: slotWindowStart, $lte: slotWindowEnd },
        status: { $in: ['pending', 'confirmed'] },
      },
      {
        $set: {
          status: 'cancelled',
          cancellationReason: 'Session cancelled by doctor',
          updatedAt: new Date(),
        },
      }
    );

    // Compute 6% cancellation charge on the channeling fee per booked appointment
    const CHANNELING_RATE = 0.10;
    const CANCELLATION_CHARGE_RATE = 0.06;
    const doctor = await RegisteredDoctor.findById(session.doctorId).select('consultationFee');
    const doctorFee  = doctor?.consultationFee || 0;
    const hospCharge = session.hospitalCharge  || 0;
    const channelingFeePerApt   = Math.round((doctorFee + hospCharge) * CHANNELING_RATE);
    const chargePerApt          = Math.round(channelingFeePerApt * CANCELLATION_CHARGE_RATE);
    const totalCancellationCharge = chargePerApt * session.bookedCount;

    // Cancel the session itself and record the charge
    session.status = 'cancelled';
    session.cancellationCharge = totalCancellationCharge;
    session.updatedAt = new Date();
    await session.save();

    // Notify affected patients (non-blocking)
    Appointment.find({
      doctorId: session.doctorId,
      slotTime: { $gte: slotWindowStart, $lte: slotWindowEnd },
      status: 'cancelled',
    }).then(appointments => {
      appointments.forEach(apt => {
        notificationService.sendStatusUpdate(apt, 'cancelled').catch(() => {});
      });
    }).catch(() => {});

    res.json({
      success: true,
      data: session,
      message: `Session cancelled. ${modifiedCount} appointment(s) cancelled and patients notified.`,
      affectedAppointments: modifiedCount,
      cancellationCharge: totalCancellationCharge,
      cancellationChargePerApt: chargePerApt,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Close booking for a session
app.patch('/api/v1/channeling-sessions/:id/close', requireAuth, async (req, res) => {
  try {
    const session = await ChannelingSession.findOne({ _id: req.params.id, doctorId: req.user.id });
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
    if (['cancelled', 'completed', 'closed'].includes(session.status)) {
      return res.status(400).json({ success: false, error: `Session is already ${session.status}` });
    }

    session.status = 'closed';
    session.updatedAt = new Date();
    await session.save();

    res.json({ success: true, data: session, message: 'Booking closed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Doctor: toggle extra appointment requests on/off for a session
app.patch('/api/v1/channeling-sessions/:id/extra-requests/toggle', requireAuth, async (req, res) => {
  try {
    const session = await ChannelingSession.findOne({ _id: req.params.id, doctorId: req.user.id });
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
    if (['cancelled', 'completed'].includes(session.status)) {
      return res.status(400).json({ success: false, error: 'Cannot modify a cancelled or completed session' });
    }
    session.extraRequestsEnabled = !session.extraRequestsEnabled;
    session.updatedAt = new Date();
    await session.save();
    res.json({ success: true, data: session, extraRequestsEnabled: session.extraRequestsEnabled });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Patient: book an appointment on a channeling session (called after payment)
app.post('/api/v1/channeling-sessions/:sessionId/book', requireAuth, async (req, res) => {
  try {
    const session = await ChannelingSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
    if (session.status === 'cancelled' || session.status === 'closed') {
      return res.status(400).json({ success: false, error: 'Session is no longer available' });
    }
    if (session.bookedCount >= session.totalAppointments) {
      return res.status(400).json({ success: false, error: 'Session is fully booked' });
    }

    session.bookedCount += 1;
    const appointmentNumber = session.bookedCount;
    if (session.bookedCount >= session.totalAppointments) session.status = 'full';
    session.updatedAt = new Date();
    await session.save();

    const [startHour, startMin] = session.startTime.split(':').map(Number);
    const slotTime = new Date(session.date);
    slotTime.setHours(startHour, startMin, 0, 0);

    const appointment = new Appointment({
      doctorId:          session.doctorId,
      patientId:         req.user.id,
      slotTime,
      hospitalName:      session.hospitalName,
      appointmentNumber,
      symptoms:          req.body.symptoms || '',
      status:            'confirmed',
    });
    await appointment.save();

    // Fire booking confirmation notification (non-blocking)
    notificationService.sendAppointmentConfirmation(appointment).catch(() => {});

    // Auto-save doctor to patient's My Doctors list (non-blocking)
    User.findByIdAndUpdate(req.user.id, {
      $addToSet: { myDoctors: session.doctorId },
    }).catch(() => {});

    res.status(201).json({
      success: true,
      data: {
        appointmentId:    appointment.appointmentId,
        appointmentNumber,
        hospitalName:     session.hospitalName,
        date:             session.date.toISOString().split('T')[0],
        startTime:        session.startTime,
        status:           'confirmed',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Public: get open sessions for a specific doctor (for patient app)
app.get('/api/v1/channeling-sessions/public/:doctorId', async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const sessions = await ChannelingSession.find({
      doctorId: req.params.doctorId,
      date: { $gte: today },
      status: { $in: ['open', 'full'] },
    }).sort({ date: 1, startTime: 1 });
    res.json({ success: true, data: sessions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Hospital / Clinic routes ──────────────────────────────────────────────────
const hospitalRoutes = require('./routes/hospitalRoutes');
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/v1/hospitals', hospitalRoutes); // alias for doctor portal

// ── Emergency center routes ───────────────────────────────────────────────────
const emergencyCenterRoutes = require('./routes/emergencyCenterRoutes');
app.use('/api/emergency-centers', emergencyCenterRoutes);

// ── EMR & Prescription routes ─────────────────────────────────────────────────
const emrRoutes = require('./routes/emr.routes');
app.use('/api/emr', emrRoutes);
app.use('/api/v1/emr', emrRoutes); // v1 alias for doctor portal

const prescriptionRoutes = require('./routes/prescription.routes');
app.use('/api/prescriptions', prescriptionRoutes);

// ── User / Auth / Forgot-password routes ─────────────────────────────────────
app.use("/api/admin",               adminRoutes);
app.use("/api/v1/admin",            adminRoutes);
app.use("/api/admin",               adminManagementRoutes);
app.use("/api/v1/users",            userRoutes);
app.use("/api/v1/auth",             registrationRoutes);
app.use("/api/v1/forgot-password",  forgotPasswordRoutes);
app.use("/api/v1/doctors",          doctorRegistrationRoutes);
app.use("/api/v1/pharmacy",         pharmacyRegistrationRoutes);   // register / login / approve / reject
app.use("/api/v1/pharmacy",         pharmacyOperationsRoutes);     // prescriptions management
app.use("/api/v1/pharmacy",         pharmacyRequestRoutes);        // patient->pharmacy request flow
app.use("/api/pharmacy-registration", pharmacyRegistrationRoutes);  // legacy alias for older web pages
app.use("/api/v1/orders",           orderRoutes);                  // order lifecycle

// ── Doctor channeling routes ──────────────────────────────────────────────────
app.use("/api/v1/doctor-channeling", doctorChannelingRouter);
app.use("/api/v1/otp",              otpRoutes);
app.use("/api/v1/notification",     notificationAppointmentRoutes);

// ── Doctor availability by name ───────────────────────────────────────────────
app.get("/api/v1/doctor-availability", doctorController.getDoctorAvailabilityByName);

// ── My Doctors ────────────────────────────────────────────────────────────────

// Patient: get their saved doctors list
app.get("/api/v1/users/my-doctors", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('myDoctors');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const doctors = await RegisteredDoctor.find(
      { _id: { $in: user.myDoctors || [] }, status: 'APPROVED' },
      { password: 0 }
    );
    res.json({ success: true, data: doctors });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Notifications ─────────────────────────────────────────────────────────────

// Get all notifications for the authenticated user (newest first)
app.get("/api/v1/notifications", requireAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    const unreadCount = notifications.filter(n => !n.read).length;
    res.json({ success: true, data: notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mark all notifications as read for the authenticated user (must be before /:id/read)
app.patch("/api/v1/notifications/read-all", requireAuth, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mark a single notification as read
app.patch("/api/v1/notifications/:id/read", requireAuth, async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Test push notification — call GET /api/v1/test-push while logged in
app.get("/api/v1/test-push", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('fcmToken');
    if (!user?.fcmToken) {
      return res.status(400).json({ success: false, error: 'No FCM token saved for this user. Login from the mobile app first.' });
    }
    const { sendPushNotification } = require('./utils/sendNotification');
    await sendPushNotification(user.fcmToken, 'Test Notification', 'Firebase is working!');
    res.json({ success: true, message: 'Push sent', token: user.fcmToken });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Save / update FCM device token for the authenticated user (patient or doctor)
app.post("/api/v1/save-token", requireAuth, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, error: 'token is required' });
    if (req.user.role === 'doctor') {
      await RegisteredDoctor.findByIdAndUpdate(req.user.id, { fcmToken: token });
    } else {
      await User.findByIdAndUpdate(req.user.id, { fcmToken: token });
    }
    res.json({ success: true, message: 'FCM token saved' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PayHere payment test page (served over HTTP so SDK works) ─────────────────
app.get('/test-payment', (req, res) => {
  res.sendFile(require('path').resolve(__dirname, '../test-payment.html'));
});

// Global error handler — must be last middleware
app.use(errorHandler);

// ── Test email route ───────────────────────────────────────────────────────────
const { sendEmail } = require("./services/emailService");
app.get("/test-email", async (_req, res) => {
  const result = await sendEmail(
    "thepremiumict@gmail.com",
    "Lakwedha Test",
    "Email working 🚀"
  );
  res.json(result);
});

// Send appointment payment receipt to patient email
app.post('/api/v1/receipts/appointment/email', requireAuth, async (req, res) => {
  try {
    const {
      to,
      doctorName,
      hospitalName,
      date,
      time,
      appointmentNumber,
      transactionId,
      paymentMethod,
      paidAt,
      doctorFee,
      hospitalCharge,
      channelingCharge,
      totalAmount,
    } = req.body || {};

    if (!to || typeof to !== 'string' || !to.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid recipient email is required' });
    }

    const subject = `Lakwedha Appointment Receipt - ${transactionId || 'Payment'}`;
    const lines = [
      'Your appointment payment was successful.',
      '',
      'RECEIPT DETAILS',
      `Doctor: ${doctorName || '-'}`,
      `Hospital: ${hospitalName || '-'}`,
      `Date: ${date || '-'}`,
      `Time: ${time || '-'}`,
      `Appointment No: ${appointmentNumber ?? '-'}`,
      '',
      'PAYMENT BREAKDOWN',
      `Doctor Fee: LKR ${Number(doctorFee || 0).toFixed(2)}`,
      `Hospital Charge: LKR ${Number(hospitalCharge || 0).toFixed(2)}`,
      `Channeling Charge: LKR ${Number(channelingCharge || 0).toFixed(2)}`,
      `Total Paid: LKR ${Number(totalAmount || 0).toFixed(2)}`,
      '',
      'TRANSACTION',
      `Transaction ID: ${transactionId || '-'}`,
      `Payment Method: ${paymentMethod || '-'}`,
      `Paid At: ${paidAt || '-'}`,
      '',
      'Thank you for choosing Lakwedha Healthcare.',
    ];

    const result = await sendEmail(to, subject, lines.join('\n'));
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error || 'Failed to send receipt email' });
    }

    return res.status(200).json({ success: true, message: 'Receipt email sent successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));

// Graceful shutdown — releases the port so nodemon restarts cleanly
const shutdown = () => server.close(() => process.exit(0));
process.on('SIGTERM', shutdown);
process.on('SIGINT',  shutdown);
