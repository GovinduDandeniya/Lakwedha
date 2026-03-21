const cron = require('node-cron');
const Appointment = require('../doctor-channeling/models/appointment.model');
const notificationService = require('../doctor-channeling/services/notification.service');

/**
 * Runs every 10 minutes. Finds confirmed appointments whose slotTime is within
 * the next 12 hours and where a reminder has not yet been sent, then fires
 * a push + DB notification and marks the appointment so it won't be re-notified.
 */
cron.schedule('*/10 * * * *', async () => {
    try {
        const now = new Date();
        const in10Hours = new Date(now.getTime() + 10 * 60 * 60 * 1000);

        const appointments = await Appointment.find({
            slotTime: { $gte: now, $lte: in10Hours },
            status: { $in: ['pending', 'confirmed'] },
            reminderSent: false,
        });

        for (const appt of appointments) {
            await notificationService.sendAppointmentReminder(appt);
            appt.reminderSent = true;
            await appt.save();
        }

        if (appointments.length > 0) {
            console.log(`Reminder job: sent ${appointments.length} reminder(s).`);
        }
    } catch (err) {
        console.error('Reminder job error:', err.message);
    }
});

console.log('Appointment reminder job scheduled (runs every 10 minutes).');
