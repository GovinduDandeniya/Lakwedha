const cron = require('node-cron');
const Appointment = require('../doctor-channeling/models/appointment.model');
const ChannelingSession = require('../doctor-channeling/models/channelingSession.model');
const notificationService = require('../doctor-channeling/services/notification.service');

/**
 * Runs every hour. Auto-marks channeling sessions as 'completed' when their
 * date has passed and they are still in open/full/closed status.
 */
cron.schedule('0 * * * *', async () => {
    try {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const result = await ChannelingSession.updateMany(
            { date: { $lt: now }, status: { $in: ['open', 'full', 'closed'] } },
            { $set: { status: 'completed', updatedAt: new Date() } }
        );

        if (result.modifiedCount > 0) {
            console.log(`Session completion job: marked ${result.modifiedCount} session(s) as completed.`);
        }
    } catch (err) {
        console.error('Session completion job error:', err.message);
    }
});

console.log('Session auto-completion job scheduled (runs every hour).');

/**
 * Runs every 10 minutes. Finds confirmed appointments whose slotTime is within
 * the next 12 hours and where a reminder has not yet been sent, then fires
 * a push + DB notification and marks the appointment so it won't be re-notified.
 */
cron.schedule('*/10 * * * *', async () => {
    try {
        const now = new Date();
        const in12Hours = new Date(now.getTime() + 12 * 60 * 60 * 1000);

        const appointments = await Appointment.find({
            slotTime: { $gte: now, $lte: in12Hours },
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
