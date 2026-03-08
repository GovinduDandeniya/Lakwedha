
const appointmentConfirmation = (patientName, doctorName, slotTime) => {
    const formatted = new Date(slotTime).toLocaleString('en-LK', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
    return `Hi ${patientName}, your appointment with Dr. ${doctorName} is confirmed for ${formatted}. - Lakwedha`;
};
const verb = {
        confirmed: 'confirmed',
        cancelled: 'cancelled',
        rescheduled: 'rescheduled',
        completed: 'marked as completed',
        'no-show': 'marked as no-show',
    }[status] || status;