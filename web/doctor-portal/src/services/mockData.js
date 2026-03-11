/**
 * mockData.js
 * -----------
 * Development-only mock responses.
 * Used automatically when the real backend (localhost:5000) is unreachable.
 */

const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

const dayOffset = (n) => {
    const d = new Date(); d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
};

// ── Today's appointments (all confirmed = paid) ───────────────────────────────
export const MOCK_APPOINTMENTS = [

    // ── Nawaloka Hospital ─────────────────────────────────────────────────────
    { id: 'n1',  appointmentNumber: '1',  date: today, hospital: 'Nawaloka Hospital', status: 'confirmed', isPaid: true, paymentStatus: 'paid', patientTitle: 'Mr.',  patientFirstName: 'Kasun',     patientLastName: 'Perera',        patientAge: 45, totalVisits: 0 },
    { id: 'n2',  appointmentNumber: '2',  date: today, hospital: 'Nawaloka Hospital', status: 'confirmed', isPaid: true, paymentStatus: 'paid', patientTitle: 'Mrs.', patientFirstName: 'Nadeesha',   patientLastName: 'Silva',          patientAge: 52, totalVisits: 4 },
    { id: 'n3',  appointmentNumber: '3',  date: today, hospital: 'Nawaloka Hospital', status: 'confirmed', isPaid: true, paymentStatus: 'paid', patientTitle: 'Mr.',  patientFirstName: 'Ruwan',       patientLastName: 'Fernando',       patientAge: 38, totalVisits: 0 },
    { id: 'n4',  appointmentNumber: '4',  date: today, hospital: 'Nawaloka Hospital', status: 'confirmed', isPaid: true, paymentStatus: 'paid', patientTitle: 'Ms.',  patientFirstName: 'Chathurika',  patientLastName: 'Jayasinghe',     patientAge: 29, totalVisits: 2 },
    { id: 'n5',  appointmentNumber: '5',  date: today, hospital: 'Nawaloka Hospital', status: 'confirmed', isPaid: true, paymentStatus: 'paid', patientTitle: 'Mr.',  patientFirstName: 'Saman',       patientLastName: 'Wickramasinghe', patientAge: 61, totalVisits: 7 },
    { id: 'n6',  appointmentNumber: '6',  date: today, hospital: 'Nawaloka Hospital', status: 'confirmed', isPaid: true, paymentStatus: 'paid', patientTitle: 'Mrs.', patientFirstName: 'Dilrukshi',   patientLastName: 'Rathnayake',     patientAge: 44, totalVisits: 1 },
    { id: 'n7',  appointmentNumber: '7',  date: today, hospital: 'Nawaloka Hospital', status: 'confirmed', isPaid: true, paymentStatus: 'paid', patientTitle: 'Mr.',  patientFirstName: 'Pradeep',     patientLastName: 'Kumara',         patientAge: 35, totalVisits: 0 },
    { id: 'n8',  appointmentNumber: '8',  date: today, hospital: 'Nawaloka Hospital', status: 'completed', isPaid: true, paymentStatus: 'paid', patientTitle: 'Ms.',  patientFirstName: 'Nimesha',     patientLastName: 'Herath',         patientAge: 27, totalVisits: 3 },
    { id: 'n9',  appointmentNumber: '9',  date: today, hospital: 'Nawaloka Hospital', status: 'completed', isPaid: true, paymentStatus: 'paid', patientTitle: 'Mr.',  patientFirstName: 'Tharaka',     patientLastName: 'Bandara',        patientAge: 48, totalVisits: 5 },
    { id: 'n10', appointmentNumber: '10', date: today, hospital: 'Nawaloka Hospital', status: 'cancelled', isPaid: true, paymentStatus: 'refunded', patientTitle: 'Mrs.', patientFirstName: 'Sandya', patientLastName: 'Liyanage',       patientAge: 55, totalVisits: 0 },

    // ── Lanka Hospital ────────────────────────────────────────────────────────
    { id: 'l1',  appointmentNumber: '1',  date: today, hospital: 'Lanka Hospital', status: 'confirmed', isPaid: true, paymentStatus: 'paid', patientTitle: 'Ms.',  patientFirstName: 'Dinithi',    patientLastName: 'Perera',        patientAge: 29, totalVisits: 0 },
    { id: 'l2',  appointmentNumber: '2',  date: today, hospital: 'Lanka Hospital', status: 'confirmed', isPaid: true, paymentStatus: 'paid', patientTitle: 'Mr.',  patientFirstName: 'Sahan',      patientLastName: 'Jayasinghe',    patientAge: 41, totalVisits: 6 },
    { id: 'l3',  appointmentNumber: '3',  date: today, hospital: 'Lanka Hospital', status: 'confirmed', isPaid: true, paymentStatus: 'paid', patientTitle: 'Mrs.', patientFirstName: 'Kumari',     patientLastName: 'Gunasekara',    patientAge: 58, totalVisits: 0 },
    { id: 'l4',  appointmentNumber: '4',  date: today, hospital: 'Lanka Hospital', status: 'confirmed', isPaid: true, paymentStatus: 'paid', patientTitle: 'Mr.',  patientFirstName: 'Asanka',     patientLastName: 'Ranasinghe',    patientAge: 33, totalVisits: 2 },
    { id: 'l5',  appointmentNumber: '5',  date: today, hospital: 'Lanka Hospital', status: 'confirmed', isPaid: true, paymentStatus: 'paid', patientTitle: 'Ms.',  patientFirstName: 'Isuri',      patientLastName: 'Mendis',        patientAge: 24, totalVisits: 1 },
    { id: 'l6',  appointmentNumber: '6',  date: today, hospital: 'Lanka Hospital', status: 'confirmed', isPaid: true, paymentStatus: 'paid', patientTitle: 'Mr.',  patientFirstName: 'Nuwan',      patientLastName: 'Pathirana',     patientAge: 47, totalVisits: 8 },
    { id: 'l7',  appointmentNumber: '7',  date: today, hospital: 'Lanka Hospital', status: 'confirmed', isPaid: true, paymentStatus: 'paid', patientTitle: 'Mrs.', patientFirstName: 'Malini',     patientLastName: 'Jayawardena',   patientAge: 63, totalVisits: 0 },
    { id: 'l8',  appointmentNumber: '8',  date: today, hospital: 'Lanka Hospital', status: 'completed', isPaid: true, paymentStatus: 'paid', patientTitle: 'Mr.',  patientFirstName: 'Chaminda',   patientLastName: 'Dissanayake',   patientAge: 39, totalVisits: 3 },
    { id: 'l9',  appointmentNumber: '9',  date: today, hospital: 'Lanka Hospital', status: 'completed', isPaid: true, paymentStatus: 'paid', patientTitle: 'Ms.',  patientFirstName: 'Thilini',    patientLastName: 'Amarasinghe',   patientAge: 31, totalVisits: 0 },
    { id: 'l10', appointmentNumber: '10', date: today, hospital: 'Lanka Hospital', status: 'cancelled', isPaid: true, paymentStatus: 'refunded', patientTitle: 'Mr.', patientFirstName: 'Roshan', patientLastName: 'Gunawardana',   patientAge: 52, totalVisits: 4 },
];

// ── Mock patients ─────────────────────────────────────────────────────────────
export const MOCK_PATIENTS = MOCK_APPOINTMENTS.map((a, i) => ({
    id: `p${i + 1}`,
    title:       a.patientTitle,
    firstName:   a.patientFirstName,
    lastName:    a.patientLastName,
    name:        `${a.patientTitle} ${a.patientFirstName} ${a.patientLastName}`,
    age:         a.patientAge,
    totalVisits: Math.floor(Math.random() * 6) + 1,
    lastVisit:   today,
}));

// ── Mock patient appointment history (shows New Patient vs Follow-up) ─────────
export const MOCK_PATIENT_HISTORY = [
    { id: 'h1', appointmentNumber: '3', date: dayOffset(-90), hospital: 'Nawaloka Hospital', status: 'completed' },
    { id: 'h2', appointmentNumber: '5', date: dayOffset(-45), hospital: 'Lanka Hospital',    status: 'completed' },
    { id: 'h3', appointmentNumber: '2', date: today,          hospital: 'Nawaloka Hospital', status: 'confirmed' },
];

// ── Mock doctor ───────────────────────────────────────────────────────────────
export const MOCK_DOCTOR = {
    id: 'doc1',
    name: 'Dr. Nimal Siripala',
    email: 'nimal.siripala@lakwedha.lk',
    specialization: 'Kayachikitsa (General Ayurveda)',
    role: 'doctor',
};

export const MOCK_TOKEN = 'dev-mock-token-lakwedha-2026';

// ── Stats ─────────────────────────────────────────────────────────────────────
const completed = MOCK_APPOINTMENTS.filter(a => a.status === 'completed').length;
const upcoming  = MOCK_APPOINTMENTS.filter(a => a.status === 'confirmed').length;

// ── Upcoming (next 2 days) ────────────────────────────────────────────────────
const MOCK_UPCOMING = [
    { id: 'u1', appointmentNumber: '1', date: dayOffset(1), hospital: 'Nawaloka Hospital', status: 'confirmed', isPaid: true, paymentStatus: 'paid', patientTitle: 'Mr.',  patientFirstName: 'Ajith',   patientLastName: 'Perera',  patientAge: 40 },
    { id: 'u2', appointmentNumber: '2', date: dayOffset(1), hospital: 'Nawaloka Hospital', status: 'confirmed', isPaid: true, paymentStatus: 'paid', patientTitle: 'Mrs.', patientFirstName: 'Chamari', patientLastName: 'Silva',   patientAge: 36 },
    { id: 'u3', appointmentNumber: '3', date: dayOffset(1), hospital: 'Nawaloka Hospital', status: 'confirmed', isPaid: true, paymentStatus: 'paid', patientTitle: 'Ms.',  patientFirstName: 'Kavindi', patientLastName: 'Fonseka', patientAge: 28 },
    { id: 'u4', appointmentNumber: '1', date: dayOffset(2), hospital: 'Lanka Hospital',    status: 'confirmed', isPaid: true, paymentStatus: 'paid', patientTitle: 'Mr.',  patientFirstName: 'Dulaj',   patientLastName: 'Perera',  patientAge: 34 },
    { id: 'u5', appointmentNumber: '2', date: dayOffset(2), hospital: 'Lanka Hospital',    status: 'confirmed', isPaid: true, paymentStatus: 'paid', patientTitle: 'Mrs.', patientFirstName: 'Sewwandi',patientLastName: 'Kumari',  patientAge: 29 },
];

// ── Notifications ─────────────────────────────────────────────────────────────
const MOCK_NOTIFICATIONS = [
    { id: 'notif1', type: 'booking',      message: 'New appointment booked — Mr. Kasun Perera at Nawaloka Hospital',  time: '2 min ago',  read: false },
    { id: 'notif2', type: 'booking',      message: 'New appointment booked — Ms. Dinithi Perera at Lanka Hospital',   time: '15 min ago', read: false },
    { id: 'notif3', type: 'payment',      message: 'Payment received — Mr. Tharaka Bandara (No 9, Nawaloka)',         time: '30 min ago', read: true  },
    { id: 'notif4', type: 'payment',      message: 'Payment received — Ms. Thilini Amarasinghe (No 9, Lanka)',        time: '45 min ago', read: true  },
    { id: 'notif5', type: 'cancellation', message: 'Appointment cancelled — Mrs. Sandya Liyanage (No 10, Nawaloka)', time: '1 hr ago',   read: true  },
];

// ── Earnings ──────────────────────────────────────────────────────────────────
const MOCK_EARNINGS = {
    doctorFee:    22000,
    channelingFee: 9000,
    totalToday:   31000,
    totalMonth:  148000,
    weeklyTrend: [18000, 24000, 31000, 27000, 31000, 0, 0],
    weekDays:    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};

// ── Mock response router ──────────────────────────────────────────────────────
export const getMockResponse = (url = '', method = 'get') => {
    const m    = method.toLowerCase();
    const path = url.replace(/^\/api\/v1/, '');

    if (path === '/auth/verify' && m === 'get')  return { valid: true, user: MOCK_DOCTOR };
    if (path === '/auth/login'  && m === 'post') return { token: MOCK_TOKEN, user: MOCK_DOCTOR };

    if (path === '/appointments' && m === 'get') return { data: MOCK_APPOINTMENTS };
    if (/^\/appointments\/[^/]+\/complete$/.test(path) && m === 'patch') return { success: true };

    if (path === '/dashboard/stats'               && m === 'get') return { todayAppointments: MOCK_APPOINTMENTS.length, completedToday: completed, pendingToday: upcoming, upcomingAppointments: MOCK_UPCOMING.length, totalPatients: MOCK_PATIENTS.length, earningsToday: MOCK_EARNINGS.totalToday, earningsMonth: MOCK_EARNINGS.totalMonth };
    if (path === '/dashboard/today-appointments'  && m === 'get') return { data: MOCK_APPOINTMENTS };
    if (path === '/dashboard/upcoming'            && m === 'get') return { data: MOCK_UPCOMING };
    if (path === '/dashboard/notifications'       && m === 'get') return { data: MOCK_NOTIFICATIONS };
    if (path === '/dashboard/earnings'            && m === 'get') return { data: MOCK_EARNINGS };
    if (/^\/dashboard\/appointments\/[^/]+\/complete$/.test(path) && m === 'patch') return { success: true };

    if (path === '/patients' && m === 'get') return { data: MOCK_PATIENTS };
    if (/^\/patients\/[^/]+\/history$/.test(path) && m === 'get') return { data: MOCK_PATIENT_HISTORY };

    return null;
};
