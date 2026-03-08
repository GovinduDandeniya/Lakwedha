
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
        });
    const verb = {
       confirmed: 'confirmed',
        cancelled: 'cancelled',
        rescheduled: 'rescheduled',
        completed: 'marked as completed',
        'no-show': 'marked as no-show',
    }[status] || status;
    return `Hi ${patientName}, your appointment on ${formatted} has been ${verb}. - Lakwedha`;
};
const orderStatusChange = (userName, orderId, status) => {
    const short = String(orderId).slice(-6).toUpperCase();
    const labels = {
        pending: 'received and pending review',
        approved: 'approved by the pharmacy',
        processing: 'being prepared',
        shipped: 'dispatched and on its way',
        completed: 'delivered successfully',
    };
    const label = labels[status] || status;
    return `Hi ${userName}, your order #${short} is ${label}. - Lakwedha`;
};
const prescriptionApproved = (userName) =>
    `Hi ${userName}, your prescription has been reviewed and approved by our pharmacy. Your order is now being processed. - Lakwedha`;
const prescriptionRejected = (userName) =>
    `Hi ${userName}, your prescription could not be approved. Please visit a Lakwedha pharmacy or contact support for assistance. - Lakwedha`;
module.exports = {
    appointmentConfirmation,
    appointmentStatusChange,
    orderStatusChange,
    prescriptionApproved,
    prescriptionRejected,
};