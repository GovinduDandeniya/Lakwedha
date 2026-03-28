export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://lakwedha.onrender.com/api/v1';

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

export const AYURVEDA_SPECIALIZATIONS = [
    // General
    'Kayachikitsa (General Ayurveda)',
    // Surgery
    'Shalya Tantra (Ayurveda Surgery)',
    'Kshara Sutra (Para-Surgical)',
    // ENT / Head
    'Shalakya Tantra (ENT & Eye)',
    'Netra Roga (Eye Diseases)',
    'Karna Roga (Ear Diseases)',
    'Nasa Roga (Nose Diseases)',
    // Child & Women Health
    'Kaumarbhritya / Bala Roga (Pediatrics)',
    'Stri Roga (Gynecology)',
    'Prasuti Tantra (Obstetrics)',
    // Toxicology
    'Agada Tantra (Toxicology)',
    'Snake Bite Treatment',
    // Mental Health
    'Bhuta Vidya (Mental Health)',
    // Rejuvenation & Wellness
    'Rasayana Therapy (Rejuvenation)',
    'Anti-Aging Ayurveda',
    // Reproductive Health
    'Vajikarana (Fertility & Sexual Health)',
    // Practical Specialties
    'Panchakarma (Detox Therapy)',
    'Sandhi Roga (Joint Diseases)',
    'Arthritis Treatment',
    'Orthopedic Ayurveda',
    'Fracture Treatment (Traditional Bone Setter)',
    'Paralysis Treatment',
    'Neurological Disorder Treatment',
    // Skin, Hair & Beauty
    'Twak Roga (Skin Diseases)',
    'Ayurveda Dermatology',
    'Hair Loss Treatment',
    'Ayurveda Cosmetics',
    // Lifestyle & Chronic Disease
    'Diabetes Ayurveda',
    'Obesity & Weight Loss',
    'Digestive Disorder Treatment',
    'Liver Disease Treatment',
    'Asthma & Respiratory Treatment',
    // Therapy Based
    'Abhyanga Therapy',
    'Shirodhara Therapy',
    'Nasya Therapy',
    'Vasti Therapy',
    'Herbal Medicine',
];