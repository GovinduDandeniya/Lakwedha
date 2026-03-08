const notificationService = require('./notificationService');
/**
 * Fire an appointment-related notification for the patient.
 *
 * @param {Object} appointment  -  Mongoose Appointment document
 * @param {string} status       - New status string
 * @param {string} patientName  - Patient's display name
 * @param {string} doctorName   - Doctor's display name
 */
const notifyAppointmentChange = (appointment, status, patientName, doctorName) => {
    // Non-blocking – caller does not need to await
    notificationService
        .notifyAppointment(appointment, status, patientName, doctorName)
        .catch((err) =>
            console.error('[appointmentNotifications] Error firing notification:', err.message)
        );
};

module.exports = { notifyAppointmentChange };
