const Notification = require('../../models/Notification');
const User = require('../../models/user');
const RegisteredDoctor = require('../../models/RegisteredDoctor');
const { sendPushNotification } = require('../../utils/sendNotification');

class NotificationService {
    /**
     * Save a notification to DB and optionally send a push to the user's FCM token.
     * @private
     */
    async _notify(userId, title, message, type, appointmentId = null) {
        await Notification.create({ userId, title, message, type, appointmentId });

        const user = await User.findById(userId).select('fcmToken');
        if (user?.fcmToken) {
            await sendPushNotification(user.fcmToken, title, message);
        }
    }

    /**
     * Booking confirmation — sent to the patient and doctor right after booking.
     */
    async sendAppointmentConfirmation(appointment) {
        try {
            // Notify patient (DB + push)
            await this._notify(
                appointment.patientId,
                'Appointment Confirmed',
                'Your appointment has been successfully booked.',
                'BOOKING',
                appointment._id
            );

            // Notify doctor (push only — doctor manages appointments via portal)
            const doctor = await RegisteredDoctor.findById(appointment.doctorId).select('fcmToken');
            if (doctor?.fcmToken) {
                await sendPushNotification(
                    doctor.fcmToken,
                    'New Appointment',
                    'A patient has booked an appointment with you.'
                );
            }
        } catch (err) {
            console.error('Notification error (confirmation):', err.message);
        }
    }

    /**
     * Status change — sent to the patient whenever the appointment status changes.
     */
    async sendStatusUpdate(appointment, newStatus) {
        const messages = {
            cancelled:   'Your appointment has been cancelled.',
            completed:   'Your appointment is marked as completed.',
            confirmed:   'Your appointment has been confirmed.',
            rescheduled: 'Your appointment has been rescheduled.',
            'no-show':   'You were marked as a no-show for your appointment.',
        };
        const message = messages[newStatus] || `Your appointment status changed to ${newStatus}.`;

        try {
            await this._notify(
                appointment.patientId,
                'Appointment Update',
                message,
                'STATUS_UPDATE',
                appointment._id
            );
        } catch (err) {
            console.error('Notification error (status update):', err.message);
        }
    }

    /**
     * Slot available — sent to a queued patient when a slot opens up.
     */
    async sendSlotAvailableNotification(patientId, _doctorInfo, slotTime) {
        try {
            const timeStr = new Date(slotTime).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
            });
            await this._notify(
                patientId,
                'Slot Available',
                `A slot has opened up for ${timeStr}. Book now before it fills up.`,
                'SLOT_AVAILABLE'
            );
        } catch (err) {
            console.error('Notification error (slot available):', err.message);
        }
    }

    /**
     * 12-hour reminder — called by the cron job.
     */
    async sendAppointmentReminder(appointment) {
        try {
            await this._notify(
                appointment.patientId,
                'Appointment Reminder',
                'You have an appointment in 12 hours. Please be on time.',
                'REMINDER',
                appointment._id
            );
        } catch (err) {
            console.error('Notification error (reminder):', err.message);
        }
    }
}

module.exports = new NotificationService();
