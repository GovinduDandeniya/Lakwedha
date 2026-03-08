
const appointmentConfirmation = (patientName, doctorName, slotTime) => {
    const formatted = new Date(slotTime).toLocaleString('en-LK', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
    return `Hi ${patientName}, your appointment with Dr. ${doctorName} is confirmed for ${formatted}. - Lakwedha`;
};
const appointmentStatusChange = (patientName, status, slotTime) => {
    const formatted = new Date(slotTime).toLocaleString('en-LK', {
        dateStyle: 'medium',
        timeStyle: 'short',