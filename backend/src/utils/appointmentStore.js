/**
 * Appointment Store Utility
 * Provides an in-memory array to store mock appointment data
 * for the notification system demonstration.
 */

// In-memory array of appointments
const appointments = [];

/**
 * Save an appointment to the in-memory store.
 * @param {object} appointmentData - The appointment details
 * @returns {object} The saved appointment with an auto-generated ID
 */
const saveAppointment = (appointmentData) => {
    const newAppointment = {
        id: `APT-${Date.now().toString().slice(-6)}`,
        createdAt: new Date().toISOString(),
        ...appointmentData
    };
    
    appointments.push(newAppointment);
    console.log(`💾 Appointment Store: Saved new appointment ${newAppointment.id}`);
    
    return newAppointment;
};

/**
 * Get all saved appointments.
 * @returns {Array} Array of appointment objects
 */
const getAllAppointments = () => {
    return [...appointments];
};

module.exports = { saveAppointment, getAllAppointments };
