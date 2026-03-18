/**
 * mockData.js
 * -----------
 * Development-only mock responses.
 * Used automatically when the real backend (localhost:5000) is unreachable.
 */

const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"


export const MOCK_APPOINTMENTS = [];

export const MOCK_PATIENTS = [];

export const MOCK_PATIENT_HISTORY = [];

// ── Mock response router ──────────────────────────────────────────────────────
export const getMockResponse = (url = '', method = 'get') => {
    const m    = method.toLowerCase();
    const path = url.replace(/^\/api\/v1/, '');

    if (path === '/auth/verify' && m === 'get')  return { valid: false };
    if (path === '/auth/login'  && m === 'post') return { token: null, user: null };

    if (path === '/appointments' && m === 'get') return { data: [] };
    if (/^\/appointments\/[^/]+\/complete$/.test(path) && m === 'patch') return { success: true };

    if (path === '/dashboard/stats'               && m === 'get') return { todayAppointments: 0, completedToday: 0, pendingToday: 0, upcomingAppointments: 0, totalPatients: 0, earningsToday: 0, earningsMonth: 0 };
    if (path === '/dashboard/today-appointments'  && m === 'get') return { data: [] };
    if (path === '/dashboard/upcoming'            && m === 'get') return { data: [] };
    if (path === '/dashboard/notifications'       && m === 'get') return { data: [] };
    if (path === '/dashboard/earnings'            && m === 'get') return { data: { doctorFee: 0, channelingFee: 0, totalToday: 0, totalMonth: 0, weeklyTrend: [0, 0, 0, 0, 0, 0, 0], weekDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] } };
    if (/^\/dashboard\/appointments\/[^/]+\/complete$/.test(path) && m === 'patch') return { success: true };

    if (path === '/doctors' && m === 'get') return {
        data: [
            { _id: '1', name: 'Dr. Nuwan Perera', specialization: 'Kayachikitsa (General Ayurveda)', qualification: 'BAMS, MD (Ayurveda)', experience: 12, rating: 4.8, reviewCount: 134, clinicName: 'Ayurveda Wellness Center', clinicAddress: 'Colombo 07', consultationFee: 1500, isVerified: true },
            { _id: '2', name: 'Dr. Sachini Fernando', specialization: 'Panchakarma (Detox Therapy)', qualification: 'BAMS, PG Diploma', experience: 8, rating: 4.6, reviewCount: 89, clinicName: 'Green Herb Clinic', clinicAddress: 'Kandy', consultationFee: 1200, isVerified: true },
            { _id: '3', name: 'Dr. Kasun Silva', specialization: 'Shalakya Tantra (ENT & Eye)', qualification: 'BAMS', experience: 5, rating: 4.3, reviewCount: 42, clinicName: 'Dhanwanthari Hospital', clinicAddress: 'Gampaha', consultationFee: 1000, isVerified: false },
        ]
    };

    if (path === '/patients' && m === 'get') return { data: [] };
    if (/^\/patients\/[^/]+\/history$/.test(path) && m === 'get') return { data: [] };

    // Session info mock
    if (path.startsWith('/dashboard/session-info') && m === 'get') {
        const dateParam = url.match(/date=([^&]+)/)?.[1] || today;
        return { success: true, date: dateParam, hospitals: [] };
    }

    // Cancel session mock
    if (path === '/dashboard/cancel-session' && m === 'post') {
        return { success: true, message: 'Session cancelled (mock). Patients notified.', affectedCount: 0, hospital: 'ALL' };
    }

    if (path === '/channeling-sessions' && m === 'get')
        return { success: true, data: [] };

    if (path === '/channeling-sessions' && m === 'post')
        return { success: true, data: {}, message: 'Session released' };

    if (/^\/channeling-sessions\/[^/]+$/.test(path) && m === 'patch')
        return { success: true, data: {}, message: 'Session updated' };

    if (/^\/channeling-sessions\/[^/]+\/cancel$/.test(path) && m === 'patch')
        return { success: true, data: { status: 'cancelled' }, message: 'Session cancelled' };

    if (/^\/channeling-sessions\/[^/]+\/close$/.test(path) && m === 'patch')
        return { success: true, data: { status: 'closed' }, message: 'Booking closed' };

    return null;
};
