const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const cors = require("cors");

const doctorChannelingRouter = require("./doctor-channeling/index");
const doctorController = require("./doctor-channeling/controllers/doctor.controller");

const app = express();

app.use(cors());
app.use(bodyParser.json());

// ── MongoDB (optional — controllers fall back to mock data if not connected) ──
const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));
} else {
  console.log("No MONGODB_URI set — running with mock data");
}

// ── Auth ─────────────────────────────────────────────────────────────────────
const SECRET_KEY = process.env.JWT_SECRET || "mysecretkey123";

const doctors = [
  {
    id: 1,
    name: "Dr. Sandaru",
    email: "sandaru@lakwedha.com",
    password: bcrypt.hashSync("1234", 8),
    role: "doctor",
    specialization: "General Physician"
  }
];

// Legacy login (username-based)
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = doctors.find(u => u.name.toLowerCase().includes(username?.toLowerCase()));
  if (!user) return res.status(404).send("User not found");
  if (!bcrypt.compareSync(password, user.password)) return res.status(401).send("Invalid password");
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: "1h" });
  res.send({ message: "Login successful", token });
});

// Doctor portal login (email-based)
app.post("/api/v1/auth/login", (req, res) => {
  const { email, password, role } = req.body;
  const user = doctors.find(u => u.email === email && u.role === (role || "doctor"));
  if (!user) return res.status(401).json({ message: "Invalid email or password" });
  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ message: "Invalid email or password" });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: "8h" });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, specialization: user.specialization } });
});

// Token verification
app.get("/api/v1/auth/verify", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.json({ valid: false });
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = doctors.find(u => u.id === decoded.id);
    if (!user) return res.json({ valid: false });
    res.json({ valid: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, specialization: user.specialization } });
  } catch {
    res.json({ valid: false });
  }
});

// ── Patients & full appointments mock data ────────────────────────────────────
const mockPatients = [
  { id: 1, name: 'Kasun Perera',         age: 34, gender: 'Male',   phone: '+94771234567', email: 'kasun@email.com',    lastVisit: '2026-03-08', totalVisits: 5,  bloodGroup: 'O+',  condition: 'Hypertension' },
  { id: 2, name: 'Malini Silva',          age: 28, gender: 'Female', phone: '+94772345678', email: 'malini@email.com',   lastVisit: '2026-03-08', totalVisits: 3,  bloodGroup: 'A+',  condition: 'Diabetes' },
  { id: 3, name: 'Ravi Fernando',         age: 45, gender: 'Male',   phone: '+94773456789', email: 'ravi@email.com',     lastVisit: '2026-03-08', totalVisits: 8,  bloodGroup: 'B+',  condition: 'Back Pain' },
  { id: 4, name: 'Sunethra Jayawardena',  age: 52, gender: 'Female', phone: '+94774567890', email: 'sunethra@email.com', lastVisit: '2026-03-08', totalVisits: 12, bloodGroup: 'AB+', condition: 'Arthritis' },
  { id: 5, name: 'Priya Wickramasinghe',  age: 31, gender: 'Female', phone: '+94775678901', email: 'priya@email.com',    lastVisit: '2026-03-08', totalVisits: 2,  bloodGroup: 'O-',  condition: 'Migraine' },
  { id: 6, name: 'Nimal Bandara',         age: 67, gender: 'Male',   phone: '+94776789012', email: 'nimal@email.com',    lastVisit: '2026-02-25', totalVisits: 15, bloodGroup: 'B-',  condition: 'Heart Disease' },
  { id: 7, name: 'Chamari Rajapaksa',     age: 39, gender: 'Female', phone: '+94777890123', email: 'chamari@email.com',  lastVisit: '2026-02-20', totalVisits: 4,  bloodGroup: 'A-',  condition: 'Thyroid' },
  { id: 8, name: 'Rohan Seneviratne',     age: 55, gender: 'Male',   phone: '+94778901234', email: 'rohan@email.com',    lastVisit: '2026-02-15', totalVisits: 7,  bloodGroup: 'O+',  condition: 'Diabetes' },
];

const mockAllAppointments = [
  { id: 1,  appointmentNumber: 'APT-001', patientName: 'Kasun Perera',        time: '09:00 AM', date: '2026-03-08', hospital: 'Nawaloka Hospital', status: 'completed' },
  { id: 2,  appointmentNumber: 'APT-002', patientName: 'Malini Silva',         time: '10:30 AM', date: '2026-03-08', hospital: 'Nawaloka Hospital', status: 'completed' },
  { id: 3,  appointmentNumber: 'APT-003', patientName: 'Ravi Fernando',        time: '11:00 AM', date: '2026-03-08', hospital: 'Lanka Hospital',    status: 'pending' },
  { id: 4,  appointmentNumber: 'APT-004', patientName: 'Sunethra Jayawardena', time: '02:00 PM', date: '2026-03-08', hospital: 'Lanka Hospital',    status: 'pending' },
  { id: 5,  appointmentNumber: 'APT-005', patientName: 'Priya Wickramasinghe', time: '03:30 PM', date: '2026-03-08', hospital: 'Nawaloka Hospital', status: 'cancelled' },
  { id: 6,  appointmentNumber: 'APT-006', patientName: 'Nimal Bandara',        time: '09:00 AM', date: '2026-03-09', hospital: 'Nawaloka Hospital', status: 'confirmed' },
  { id: 7,  appointmentNumber: 'APT-007', patientName: 'Chamari Rajapaksa',    time: '11:30 AM', date: '2026-03-09', hospital: 'Lanka Hospital',    status: 'confirmed' },
  { id: 8,  appointmentNumber: 'APT-008', patientName: 'Rohan Seneviratne',    time: '10:00 AM', date: '2026-03-10', hospital: 'Nawaloka Hospital', status: 'pending' },
  { id: 9,  appointmentNumber: 'APT-009', patientName: 'Kasun Perera',         time: '02:00 PM', date: '2026-03-05', hospital: 'Lanka Hospital',    status: 'completed' },
  { id: 10, appointmentNumber: 'APT-010', patientName: 'Malini Silva',         time: '11:00 AM', date: '2026-03-04', hospital: 'Asiri Hospital',    status: 'completed' },
  { id: 11, appointmentNumber: 'APT-011', patientName: 'Ravi Fernando',        time: '09:30 AM', date: '2026-03-03', hospital: 'Nawaloka Hospital', status: 'cancelled' },
  { id: 12, appointmentNumber: 'APT-012', patientName: 'Nimal Bandara',        time: '03:00 PM', date: '2026-03-02', hospital: 'Asiri Hospital',    status: 'completed' },
];

app.get("/api/v1/appointments", (req, res) => {
  const { status } = req.query;
  let data = mockAllAppointments;
  if (status && status !== 'all') data = data.filter(a => a.status === status);
  res.json({ success: true, data, total: data.length });
});

app.patch("/api/v1/appointments/:id/complete", (req, res) => {
  const apt = mockAllAppointments.find(a => a.id === parseInt(req.params.id));
  if (apt) apt.status = 'completed';
  res.json({ success: true, message: 'Appointment marked as completed' });
});

app.get("/api/v1/patients", (req, res) => {
  const { search } = req.query;
  let data = mockPatients;
  if (search) data = data.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.condition.toLowerCase().includes(search.toLowerCase())
  );
  res.json({ success: true, data, total: data.length });
});

app.get("/api/v1/patients/:id/history", (req, res) => {
  const patient = mockPatients.find(p => p.id === parseInt(req.params.id));
  if (!patient) return res.status(404).json({ success: false });
  const history = mockAllAppointments.filter(a => a.patientName === patient.name);
  res.json({ success: true, data: history });
});

// ── Dashboard mock data ───────────────────────────────────────────────────────
const mockTodayAppointments = [
  { id: 1, appointmentNumber: 'APT-001', patientName: 'Kasun Perera', time: '09:00 AM', hospital: 'Nawaloka Hospital', status: 'completed' },
  { id: 2, appointmentNumber: 'APT-002', patientName: 'Malini Silva', time: '10:30 AM', hospital: 'Nawaloka Hospital', status: 'completed' },
  { id: 3, appointmentNumber: 'APT-003', patientName: 'Ravi Fernando', time: '11:00 AM', hospital: 'Lanka Hospital', status: 'pending' },
  { id: 4, appointmentNumber: 'APT-004', patientName: 'Sunethra Jayawardena', time: '02:00 PM', hospital: 'Lanka Hospital', status: 'pending' },
  { id: 5, appointmentNumber: 'APT-005', patientName: 'Priya Wickramasinghe', time: '03:30 PM', hospital: 'Nawaloka Hospital', status: 'cancelled' },
];

const mockUpcoming = [
  { id: 1, date: 'Tomorrow', time: '09:00 AM', hospital: 'Nawaloka Hospital', patientName: 'Nimal Bandara' },
  { id: 2, date: 'Tomorrow', time: '11:30 AM', hospital: 'Lanka Hospital', patientName: 'Chamari Rajapaksa' },
  { id: 3, date: 'Mar 10', time: '10:00 AM', hospital: 'Nawaloka Hospital', patientName: 'Rohan Seneviratne' },
  { id: 4, date: 'Mar 11', time: '02:30 PM', hospital: 'Asiri Hospital', patientName: 'Dilani Mendis' },
];

const mockNotifications = [
  { id: 1, type: 'booking', message: 'New appointment booked by Kasun Perera', time: '10 min ago', read: false },
  { id: 2, type: 'cancellation', message: 'Appointment cancelled by Priya Wickramasinghe', time: '1 hour ago', read: false },
  { id: 3, type: 'payment', message: 'Payment confirmed for APT-002 - LKR 1,500', time: '2 hours ago', read: true },
  { id: 4, type: 'booking', message: 'New appointment booked by Nimal Bandara', time: '3 hours ago', read: true },
  { id: 5, type: 'payment', message: 'Payment confirmed for APT-001 - LKR 1,500', time: '5 hours ago', read: true },
];

const mockEarnings = {
  doctorFee: 12500,
  channelingFee: 2500,
  totalToday: 15000,
  totalMonth: 187500,
  weeklyTrend: [22000, 18500, 25000, 19500, 28000, 15000, 22500],
  weekDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};

// ── Dashboard API endpoints ───────────────────────────────────────────────────
app.get("/api/v1/dashboard/stats", (req, res) => {
  res.json({
    todayAppointments: mockTodayAppointments.length,
    upcomingAppointments: mockUpcoming.length,
    totalPatients: 248,
    earningsToday: mockEarnings.totalToday,
    earningsMonth: mockEarnings.totalMonth,
    completedToday: mockTodayAppointments.filter(a => a.status === 'completed').length,
    pendingToday: mockTodayAppointments.filter(a => a.status === 'pending').length,
  });
});

app.get("/api/v1/dashboard/today-appointments", (req, res) => {
  res.json({ success: true, data: mockTodayAppointments });
});

app.get("/api/v1/dashboard/upcoming", (req, res) => {
  res.json({ success: true, data: mockUpcoming });
});

app.get("/api/v1/dashboard/notifications", (req, res) => {
  res.json({ success: true, data: mockNotifications, unreadCount: mockNotifications.filter(n => !n.read).length });
});

app.get("/api/v1/dashboard/earnings", (req, res) => {
  res.json({ success: true, data: mockEarnings });
});

app.patch("/api/v1/dashboard/appointments/:id/complete", (req, res) => {
  const apt = mockTodayAppointments.find(a => a.id === parseInt(req.params.id));
  if (apt) apt.status = 'completed';
  res.json({ success: true, message: 'Appointment marked as completed' });
});

// ── Doctor channeling routes ──────────────────────────────────────────────────
app.use("/doctor-channeling", doctorChannelingRouter);

// ── Doctor availability by name ───────────────────────────────────────────────
app.get("/api/doctor-availability", doctorController.getDoctorAvailabilityByName);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
