/**
 * Appointment Store Utility
 * In-memory store for appointment data used by the notification system.
 */

const appointments = [];

const saveAppointment = (appointmentData) => {
    const newAppointment = {
        id: `APT-${Date.now().toString().slice(-6)}`,
        createdAt: new Date().toISOString(),
        ...appointmentData
    };
    appointments.push(newAppointment);
    return newAppointment;
};

const getAllAppointments = () => [...appointments];

module.exports = { saveAppointment, getAllAppointments };
