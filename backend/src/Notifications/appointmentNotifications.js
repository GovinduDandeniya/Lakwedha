const notificationService = require('./notificationService');
/**
 * Fire an appointment-related notification for the patient.
 *
 * @param {Object} appointment  -  Mongoose Appointment document
 * @param {string} status       - New status string
 * @param {string} patientName  - Patient's display name
 * @param {string} doctorName   - Doctor's display name
 */