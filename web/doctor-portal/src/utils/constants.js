export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

export const APPOINTMENT_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    RESCHEDULED: 'rescheduled',
    NO_SHOW: 'no-show'
};

export const APPOINTMENT_STATUS_COLORS = {
    [APPOINTMENT_STATUS.PENDING]: 'warning',
    [APPOINTMENT_STATUS.CONFIRMED]: 'info',
    [APPOINTMENT_STATUS.COMPLETED]: 'success',
    [APPOINTMENT_STATUS.CANCELLED]: 'error',
    [APPOINTMENT_STATUS.RESCHEDULED]: 'secondary',
    [APPOINTMENT_STATUS.NO_SHOW]: 'default'
};

export const ROLES = {
    DOCTOR: 'doctor',
    PATIENT: 'patient',
    ADMIN: 'admin',
    PHARMACY: 'pharmacy'
};

export const STORAGE_KEYS = {
    TOKEN: 'doctor_token',
    USER: 'doctor_user',
    SETTINGS: 'doctor_settings'
};