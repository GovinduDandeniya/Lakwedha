/**
 * mockData.js
 * -----------
 * Development-only mock responses.
 * Used automatically when the real backend (localhost:5000) is unreachable.
 */

const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

// ── 20 sample appointments: 10 per hospital ───────────────────────────────────
export const MOCK_APPOINTMENTS = [

    // ── Nawaloka Hospital ─────────────────────────────────────────────────────
    {
        id: 'n1', appointmentNumber: '1', date: today,
        patientTitle: 'Mr.', patientFirstName: 'Kasun',      patientLastName: 'Perera',
        patientAge: 45, time: '08:00 AM', hospital: 'Nawaloka Hospital',
        status: 'upcoming', isPaid: false, paymentStatus: 'pending',
    },
    {
        id: 'n2', appointmentNumber: '2', date: today,
        patientTitle: 'Mrs.', patientFirstName: 'Nadeesha',   patientLastName: 'Silva',
        patientAge: 52, time: '08:20 AM', hospital: 'Nawaloka Hospital',
        status: 'upcoming', isPaid: false, paymentStatus: 'pending',
    },
    {
        id: 'n3', appointmentNumber: '3', date: today,
        patientTitle: 'Mr.', patientFirstName: 'Ruwan',       patientLastName: 'Fernando',
        patientAge: 38, time: '08:40 AM', hospital: 'Nawaloka Hospital',
        status: 'upcoming', isPaid: false, paymentStatus: 'pending',
    },
    {
        id: 'n4', appointmentNumber: '4', date: today,
        patientTitle: 'Ms.', patientFirstName: 'Chathurika',  patientLastName: 'Jayasinghe',
        patientAge: 29, time: '09:00 AM', hospital: 'Nawaloka Hospital',
        status: 'upcoming', isPaid: false, paymentStatus: 'pending',
    },
    {
        id: 'n5', appointmentNumber: '5', date: today,
        patientTitle: 'Mr.', patientFirstName: 'Saman',       patientLastName: 'Wickramasinghe',
        patientAge: 61, time: '09:20 AM', hospital: 'Nawaloka Hospital',
        status: 'upcoming', isPaid: false, paymentStatus: 'pending',
    },
    {
        id: 'n6', appointmentNumber: '6', date: today,
        patientTitle: 'Mrs.', patientFirstName: 'Dilrukshi',  patientLastName: 'Rathnayake',
        patientAge: 44, time: '09:40 AM', hospital: 'Nawaloka Hospital',
        status: 'checked_in', isPaid: true, paymentStatus: 'paid',
    },
    {
        id: 'n7', appointmentNumber: '7', date: today,
        patientTitle: 'Mr.', patientFirstName: 'Pradeep',     patientLastName: 'Kumara',
        patientAge: 35, time: '10:00 AM', hospital: 'Nawaloka Hospital',
        status: 'checked_in', isPaid: true, paymentStatus: 'paid',
    },
    {
        id: 'n8', appointmentNumber: '8', date: today,
        patientTitle: 'Ms.', patientFirstName: 'Nimesha',     patientLastName: 'Herath',
        patientAge: 27, time: '10:20 AM', hospital: 'Nawaloka Hospital',
        status: 'completed', isPaid: true, paymentStatus: 'paid',
    },
    {
        id: 'n9', appointmentNumber: '9', date: today,
        patientTitle: 'Mr.', patientFirstName: 'Tharaka',     patientLastName: 'Bandara',
        patientAge: 48, time: '10:40 AM', hospital: 'Nawaloka Hospital',
        status: 'completed', isPaid: true, paymentStatus: 'paid',
    },
    {
        id: 'n10', appointmentNumber: '10', date: today,
        patientTitle: 'Mrs.', patientFirstName: 'Sandya',     patientLastName: 'Liyanage',
        patientAge: 55, time: '11:00 AM', hospital: 'Nawaloka Hospital',
        status: 'cancelled', isPaid: false, paymentStatus: 'pending',
    },

    // ── Lanka Hospital ────────────────────────────────────────────────────────
    {
        id: 'l1', appointmentNumber: '1', date: today,
        patientTitle: 'Ms.', patientFirstName: 'Dinithi',     patientLastName: 'Perera',
        patientAge: 29, time: '08:30 AM', hospital: 'Lanka Hospital',
        status: 'upcoming', isPaid: false, paymentStatus: 'pending',
    },
    {
        id: 'l2', appointmentNumber: '2', date: today,
        patientTitle: 'Mr.', patientFirstName: 'Sahan',       patientLastName: 'Jayasinghe',
        patientAge: 41, time: '08:50 AM', hospital: 'Lanka Hospital',
        status: 'upcoming', isPaid: false, paymentStatus: 'pending',
    },
    {
        id: 'l3', appointmentNumber: '3', date: today,
        patientTitle: 'Mrs.', patientFirstName: 'Kumari',     patientLastName: 'Gunasekara',
        patientAge: 58, time: '09:10 AM', hospital: 'Lanka Hospital',
        status: 'upcoming', isPaid: false, paymentStatus: 'pending',
    },
    {
        id: 'l4', appointmentNumber: '4', date: today,
        patientTitle: 'Mr.', patientFirstName: 'Asanka',      patientLastName: 'Ranasinghe',
        patientAge: 33, time: '09:30 AM', hospital: 'Lanka Hospital',
        status: 'upcoming', isPaid: true, paymentStatus: 'paid',
    },
    {
        id: 'l5', appointmentNumber: '5', date: today,
        patientTitle: 'Ms.', patientFirstName: 'Isuri',       patientLastName: 'Mendis',
        patientAge: 24, time: '09:50 AM', hospital: 'Lanka Hospital',
        status: 'upcoming', isPaid: false, paymentStatus: 'pending',
    },
    {
        id: 'l6', appointmentNumber: '6', date: today,
        patientTitle: 'Mr.', patientFirstName: 'Nuwan',       patientLastName: 'Pathirana',
        patientAge: 47, time: '10:10 AM', hospital: 'Lanka Hospital',
        status: 'checked_in', isPaid: true, paymentStatus: 'paid',
    },
    {
        id: 'l7', appointmentNumber: '7', date: today,
        patientTitle: 'Mrs.', patientFirstName: 'Malini',     patientLastName: 'Jayawardena',
        patientAge: 63, time: '10:30 AM', hospital: 'Lanka Hospital',
        status: 'checked_in', isPaid: true, paymentStatus: 'paid',
    },
    {
        id: 'l8', appointmentNumber: '8', date: today,
        patientTitle: 'Mr.', patientFirstName: 'Chaminda',    patientLastName: 'Dissanayake',
        patientAge: 39, time: '10:50 AM', hospital: 'Lanka Hospital',
        status: 'completed', isPaid: true, paymentStatus: 'paid',
    },
    {
        id: 'l9', appointmentNumber: '9', date: today,
        patientTitle: 'Ms.', patientFirstName: 'Thilini',     patientLastName: 'Amarasinghe',
        patientAge: 31, time: '11:10 AM', hospital: 'Lanka Hospital',
        status: 'completed', isPaid: true, paymentStatus: 'paid',
    },
    {
        id: 'l10', appointmentNumber: '10', date: today,
        patientTitle: 'Mr.', patientFirstName: 'Roshan',      patientLastName: 'Gunawardana',
        patientAge: 52, time: '11:30 AM', hospital: 'Lanka Hospital',
        status: 'cancelled', isPaid: false, paymentStatus: 'pending',
    },
];

// ── Mock patients (privacy-safe: no phone/email/NIC) ─────────────────────────
export const MOCK_PATIENTS = MOCK_APPOINTMENTS.map((a, i) => ({
    id: `p${i + 1}`,
    title:     a.patientTitle,
    firstName: a.patientFirstName,
    lastName:  a.patientLastName,
    name:      `${a.patientTitle} ${a.patientFirstName} ${a.patientLastName}`,
    age:       a.patientAge,
    totalVisits: Math.floor(Math.random() * 8) + 1,
    lastVisit: today,
}));

// ── Mock doctor (used for welcome card) ───────────────────────────────────────
export const MOCK_DOCTOR = {
    id: 'doc1',
    name: 'Dr. Nimal Siripala',
    email: 'nimal.siripala@lakwedha.lk',
    specialization: 'Kayachikitsa (General Ayurveda)',
    role: 'doctor',
};

// ── Mock token (any non-empty string works for dev) ───────────────────────────
export const MOCK_TOKEN = 'dev-mock-token-lakwedha-2026';

// ── Stat calculations ─────────────────────────────────────────────────────────
const todayApts  = MOCK_APPOINTMENTS;
const completed  = todayApts.filter(a => a.status === 'completed').length;
const pending    = todayApts.filter(a => ['upcoming', 'checked_in'].includes(a.status)).length;

// ── Upcoming schedule (next 3 days — synthetic) ───────────────────────────────
const nextDay = (offset) => {
    const d = new Date(); d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
};

const MOCK_UPCOMING = [
    { id: 'u1', appointmentNumber: '1', date: nextDay(1), time: '09:00 AM', hospital: 'Nawaloka Hospital', status: 'upcoming', patientTitle: 'Mr.', patientFirstName: 'Ajith', patientLastName: 'Perera', patientAge: 40 },
    { id: 'u2', appointmentNumber: '2', date: nextDay(1), time: '09:20 AM', hospital: 'Lanka Hospital',    status: 'upcoming', patientTitle: 'Mrs.', patientFirstName: 'Chamari', patientLastName: 'Silva', patientAge: 36 },
    { id: 'u3', appointmentNumber: '1', date: nextDay(2), time: '08:30 AM', hospital: 'Nawaloka Hospital', status: 'upcoming', patientTitle: 'Ms.', patientFirstName: 'Kavindi', patientLastName: 'Fonseka', patientAge: 28 },
];

// ── Mock notifications ────────────────────────────────────────────────────────
const MOCK_NOTIFICATIONS = [
    { id: 'notif1', type: 'booking',      message: 'New appointment booked — Mr. Kasun Perera at Nawaloka Hospital', time: '2 min ago',  read: false },
    { id: 'notif2', type: 'booking',      message: 'New appointment booked — Ms. Dinithi Perera at Lanka Hospital',  time: '15 min ago', read: false },
    { id: 'notif3', type: 'payment',      message: 'Payment received — Mr. Tharaka Bandara (No 9, Nawaloka)',        time: '30 min ago', read: true  },
    { id: 'notif4', type: 'payment',      message: 'Payment received — Ms. Thilini Amarasinghe (No 9, Lanka)',       time: '45 min ago', read: true  },
    { id: 'notif5', type: 'cancellation', message: 'Appointment cancelled — Mrs. Sandya Liyanage (No 10, Nawaloka)', time: '1 hr ago',   read: true  },
];

// ── Mock earnings ─────────────────────────────────────────────────────────────
const MOCK_EARNINGS = {
    doctorFee:     22000,
    channelingFee:  9000,
    totalToday:    31000,
    totalMonth:   148000,
    weeklyTrend:  [18000, 24000, 31000, 27000, 31000, 0, 0],
    weekDays:     ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};

// ── Mock response router ──────────────────────────────────────────────────────
/**
 * Returns mock data for a given URL + method, or null to pass through.
 * Handles dynamic segments like /patients/:id/history.
 */
export const getMockResponse = (url = '', method = 'get') => {
    const m = method.toLowerCase();
    const path = url.replace(/^\/api\/v1/, ''); // strip base prefix if present

    // Auth
    if (path === '/auth/verify' && m === 'get') {
        return { valid: true, user: MOCK_DOCTOR };
    }
    if (path === '/auth/login' && m === 'post') {
        return { token: MOCK_TOKEN, user: MOCK_DOCTOR };
    }

    // Appointments
    if (path === '/appointments' && m === 'get') {
        return { data: MOCK_APPOINTMENTS };
    }
    if (/^\/appointments\/[^/]+\/complete$/.test(path) && m === 'patch') {
        return { success: true };
    }

    // Dashboard
    if (path === '/dashboard/stats' && m === 'get') {
        return {
            todayAppointments: todayApts.length,
            completedToday:    completed,
            pendingToday:      pending,
            upcomingAppointments: MOCK_UPCOMING.length,
            totalPatients:     MOCK_PATIENTS.length,
            earningsToday:     MOCK_EARNINGS.totalToday,
            earningsMonth:     MOCK_EARNINGS.totalMonth,
        };
    }
    if (path === '/dashboard/today-appointments' && m === 'get') {
        return { data: MOCK_APPOINTMENTS };
    }
    if (path === '/dashboard/upcoming' && m === 'get') {
        return { data: MOCK_UPCOMING };
    }
    if (path === '/dashboard/notifications' && m === 'get') {
        return { data: MOCK_NOTIFICATIONS };
    }
    if (path === '/dashboard/earnings' && m === 'get') {
        return { data: MOCK_EARNINGS };
    }
    if (/^\/dashboard\/appointments\/[^/]+\/complete$/.test(path) && m === 'patch') {
        return { success: true };
    }

    // Patients
    if (path === '/patients' && m === 'get') {
        return { data: MOCK_PATIENTS };
    }
    if (/^\/patients\/[^/]+\/history$/.test(path) && m === 'get') {
        return { data: MOCK_APPOINTMENTS.slice(0, 3) };
    }

    return null; // no mock — let the real request proceed
};
