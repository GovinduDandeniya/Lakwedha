/**
 * Notification Appointment Controller
 * Handles booking appointments and sending SMS/Email confirmations.
 */

const { saveAppointment } = require('../utils/appointmentStore');
const { sendSMS } = require('../services/smsService');
const { sendEmail } = require('../services/emailService');

/**
 * Handle POST /api/v1/notification/appointments
 * Books an appointment and sends confirmations.
 */
const bookAppointment = async (req, res) => {
    try {
        const { patientName, phone, email, doctorName, hospitalName, date, time } = req.body;

        // Basic validation
        if (!patientName || !doctorName || !hospitalName || !date || !time) {
            return res.status(400).json({
                success: false,
                message: 'patientName, doctorName, hospitalName, date, and time are required'
            });
        }
        
        if (!phone && !email) {
             return res.status(400).json({
                success: false,
                message: 'At least one contact method (phone or email) is required'
            });
        }

        // 1. Save the appointment
        const appointment = saveAppointment({
            patientName,
            doctorName,
            hospitalName,
            date,
            time,
            phone,
            email,
            status: 'Confirmed'
        });

        // 2. Prepare confirmation message formats
        const smsMessage = `Appointment Confirmed!\nDoctor: ${doctorName}\nHospital: ${hospitalName}\nDate: ${date}\nTime: ${time}`;
        
        const emailSubject = `Appointment Confirmed with ${doctorName}`;
        const emailMessage = `Dear ${patientName},\n\nYour appointment has been successfully confirmed.\n\nDetails:\nDoctor: ${doctorName}\nHospital: ${hospitalName}\nDate: ${date}\nTime: ${time}\n\nThank you for using Lakwedha Health System.`;

        // 3. Send Notifications (Async, non-blocking if we wanted, but we await to report status)
        const notificationResults = {
            sms: null,
            email: null
        };

        if (phone && phone.match(/^\+[1-9]\d{1,14}$/)) {
            notificationResults.sms = await sendSMS(phone, smsMessage);
        } else if (phone) {
            notificationResults.sms = { success: false, error: 'Invalid phone format (needs E.164)' };
        }

        if (email && email.includes('@')) {
            notificationResults.email = await sendEmail(email, emailSubject, emailMessage);
        }

        // 4. Return success response
        return res.status(201).json({
            success: true,
            message: 'Appointment booked successfully',
            data: {
                appointmentId: appointment.id,
                status: appointment.status
            },
            notifications: notificationResults
        });

    } catch (error) {
        console.error('Appointment Controller Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while booking appointment'
        });
    }
};

module.exports = {
    bookAppointment
};
