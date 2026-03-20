# Lakwedha Notification System

This directory contains the production-ready notification module for the Lakwedha backend. It provides an API for sending OTPs via SMS, sending email notifications, and automatically triggering confirmations when booking appointments.

## Features
- **SMS Integration**: Built with Twilio to send SMS messages (e.g. OTPs and confirmations).
- **Email Integration**: Built with Nodemailer (Gmail SMTP) for email notifications with HTML support.
- **OTP Verification**: In-memory OTP store with automatic 5-minute expiration.
- **Appointment Booking**: Dual confirmation system (SMS + Email) triggered upon booking.

## Prerequisites
Copy `.env.example` to `.env` inside the `backend` folder and add your credentials:

```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE=your_twilio_number

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## Structure
- `config/notification.config.js`: Centralized environment variable loader and validation.
- `services/smsService.js`: Twilio client setup and `sendSMS` functionality.
- `services/emailService.js`: Nodemailer setup and `sendEmail` functionality.
- `utils/otpGenerator.js`, `utils/otpStore.js`: 5-digit OTP generation and in-memory Map store.
- `utils/appointmentStore.js`: In-memory array for mock appointments.
- `controllers/otpController.js`: Handlers for `send-otp` and `verify-otp`.
- `controllers/notificationAppointmentController.js`: Handlers for `appointments` booking.
- `routes/otpRoutes.js`, `routes/notificationAppointmentRoutes.js`: Express routing definitions.
- `middleware/errorHandler.js`: Standardized global JSON error handling.
- `middleware/requestLogger.js`: Console logging for incoming requests and payloads.
- `scripts/`: Validation scripts to test credentials without spinning up the server.

## API Endpoints

### 1. Send OTP (SMS)
**Endpoint:** `POST /api/v1/otp/send-otp`
**Body:**
```json
{
  "phone": "+94771234567"
}
```

### 2. Verify OTP
**Endpoint:** `POST /api/v1/otp/verify-otp`
**Body:**
```json
{
  "phone": "+94771234567",
  "otp": "12345"
}
```

### 3. Book Appointment (Triggers SMS & Email)
**Endpoint:** `POST /api/v1/notification/appointments`
**Body:**
```json
{
  "patientName": "John Doe",
  "phone": "+94771234567",
  "email": "johndoe@example.com",
  "doctorName": "Dr. Silva",
  "hospitalName": "Lanka Hospital",
  "date": "2026-03-25",
  "time": "10:30 AM"
}
```

## Validation Scripts
To test your `.env` credentials without running the full API:

```bash
# Check Twilio SMS configuration
node src/scripts/validateSms.js

# Check Nodemailer SMTP configuration
node src/scripts/validateEmail.js
```
