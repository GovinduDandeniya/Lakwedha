const Notification = require('../../models/Notification');
const User = require('../../models/user');
const RegisteredDoctor = require('../../models/RegisteredDoctor');
const { sendPushNotification } = require('../../utils/sendNotification');
const { sendSMS } = require('../../services/smsService');
const { sendEmail } = require('../../services/emailService');

class NotificationService {
    /**
     * Look up patient contact info and doctor name for an appointment.
     * @private
     */
    async _getContactDetails(appointment) {
        const [patient, doctor] = await Promise.all([
            User.findById(appointment.patientId).select('name email phone'),
            RegisteredDoctor.findById(appointment.doctorId).select('fullName firstName lastName title fcmToken'),
        ]);

        const slotTime = new Date(appointment.slotTime);
        const dateStr = slotTime.toLocaleDateString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric',
        });
        const timeStr = slotTime.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: true,
        });

        const doctorName = doctor?.fullName
            || [doctor?.title, doctor?.firstName, doctor?.lastName].filter(Boolean).join(' ')
            || 'Your Doctor';
        const hospital = appointment.hospitalName || 'the clinic';

        return { patient, doctor, dateStr, timeStr, doctorName, hospital };
    }

    /** Send SMS if patient has a phone number. */
    async _sendSms(phone, message) {
        if (!phone) return;
        const result = await sendSMS(phone, message);
        if (!result.success) {
            console.warn('[NotificationService] SMS delivery failed:', result.error);
        }
    }

    /** Send email if patient has an email address. */
    async _sendEmail(email, subject, message) {
        if (!email) return;
        await sendEmail(email, subject, message);
    }

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
     * Delivers: push notification + DB record + SMS + Email.
     */
    async sendAppointmentConfirmation(appointment) {
        try {
            // Push + DB notification
            await this._notify(
                appointment.patientId,
                'Appointment Confirmed',
                'Your appointment has been successfully booked.',
                'BOOKING',
                appointment._id
            );

            // Notify doctor via push
            const { patient, doctor, dateStr, timeStr, doctorName, hospital } =
                await this._getContactDetails(appointment);

            if (doctor?.fcmToken) {
                await sendPushNotification(
                    doctor.fcmToken,
                    'New Appointment',
                    'A patient has booked an appointment with you.'
                );
            }

            // SMS + Email to patient
            if (patient) {
                const message =
                    `Lakwedha Appointment Confirmed ✅\n` +
                    `Doctor: ${doctorName}\n` +
                    `Hospital: ${hospital}\n` +
                    `Date: ${dateStr}\n` +
                    `Time: ${timeStr}`;

                await Promise.all([
                    this._sendSms(patient.phone, message),
                    this._sendEmail(
                        patient.email,
                        'Appointment Confirmation - Lakwedha',
                        message
                    ),
                ]);
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
     * 10-hour reminder — called by the cron job.
     * Delivers: push notification + DB record + SMS + Email.
     */
    async sendAppointmentReminder(appointment) {
        try {
            await this._notify(
                appointment.patientId,
                'Appointment Reminder',
                'You have an appointment in 10 hours. Please be on time.',
                'REMINDER',
                appointment._id
            );

            // SMS + Email to patient
            const { patient, timeStr, doctorName } =
                await this._getContactDetails(appointment);

            if (patient) {
                const message =
                    `Reminder from Lakwedha ⏰\n` +
                    `Your appointment is in 10 hours\n` +
                    `Doctor: ${doctorName}\n` +
                    `Time: ${timeStr}`;

                await Promise.all([
                    this._sendSms(patient.phone, message),
                    this._sendEmail(
                        patient.email,
                        'Appointment Reminder - Lakwedha',
                        message
                    ),
                ]);
            }
        } catch (err) {
            console.error('Notification error (reminder):', err.message);
        }
    }

    /**
     * Emergency request received — notify the doctor (push only).
     */
    async sendEmergencyRequestReceived(doctorId) {
        try {
            const doctor = await RegisteredDoctor.findById(doctorId).select('fcmToken');
            if (doctor?.fcmToken) {
                await sendPushNotification(
                    doctor.fcmToken,
                    'Emergency Appointment Request',
                    'A patient has submitted an emergency appointment request. Please review it in your dashboard.'
                );
            }
        } catch (err) {
            console.error('Notification error (emergency request received):', err.message);
        }
    }

    /**
     * Emergency approved — notify the patient with appointment details.
     */
    async sendEmergencyApproval(patientId, appointment) {
        try {
            const dateStr = new Date(appointment.slotTime).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
            });
            await this._notify(
                patientId,
                'Emergency Request Approved',
                `Your emergency appointment request has been approved. Your appointment is on ${dateStr} at ${appointment.hospitalName || 'the clinic'}.`,
                'EMERGENCY_APPROVED',
                appointment._id
            );
        } catch (err) {
            console.error('Notification error (emergency approval):', err.message);
        }
    }

    /**
     * Emergency rejected — notify the patient.
     */
    async sendEmergencyRejection(patientId, doctorResponse) {
        try {
            const message = doctorResponse
                ? `Your emergency appointment request was declined. Doctor's note: ${doctorResponse}`
                : 'Your emergency appointment request has been declined by the doctor.';
            await this._notify(
                patientId,
                'Emergency Request Declined',
                message,
                'EMERGENCY_REJECTED'
            );
        } catch (err) {
            console.error('Notification error (emergency rejection):', err.message);
        }
    }
}

module.exports = new NotificationService();
