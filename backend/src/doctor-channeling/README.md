# Doctor Channeling Module

This module handles all doctor appointment channeling features for the Lakwedha platform, including appointment booking, availability management, queue management, clinic locations, and emergency requests.

## Module Structure

```
doctor-channeling/
├── controllers/
│   ├── appointment.controller.js     # Appointment booking & management
│   ├── availability.controller.js    # Doctor slot availability
│   ├── clinic.controller.js          # Clinic location management
│   ├── doctor.controller.js          # Doctor profile & search
│   └── emergency.controller.js       # Emergency appointment requests
├── models/
│   ├── appointment.model.js          # Appointment schema
│   ├── availability.model.js         # Doctor time-slot schema
│   ├── channelingSession.model.js    # Channeling session schema
│   ├── clinicLocation.model.js       # Clinic location schema
│   ├── doctor.model.js               # Doctor profile schema
│   └── extra_appointment_request.model.js  # Emergency request schema
├── routes/
│   ├── appointment.routes.js
│   ├── availability.routes.js
│   ├── clinic.routes.js
│   ├── doctor.routes.js
│   └── emergency.routes.js
├── services/
│   ├── availability.service.js       # Slot generation logic
│   ├── notification.service.js       # Appointment notifications
│   └── queue.service.js              # Patient queue management
├── validators/
│   └── appointment.validator.js      # Request validation (Joi)
├── constants/
│   └── ayurvedaSpecializations.js    # Specialization enum values
└── index.js                          # Module entry point
```

## API Endpoints

Base path: `/api/v1/doctor-channeling`

### Appointments

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/appointments/book` | patient | Book a time slot or join queue |
| GET | `/appointments/history` | all | Get appointment history (filterable) |
| GET | `/appointments/:appointmentId` | patient/doctor/admin | Get a single appointment by ID |
| GET | `/appointments/queue/:slotId` | all | Get current queue status for a slot |
| PATCH | `/appointments/:appointmentId/status` | doctor/patient/admin | Update appointment status |

### Availability

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/availability` | doctor | Create availability slots |
| GET | `/availability/:doctorId` | all | Get doctor's available slots |
| DELETE | `/availability/:slotId` | doctor | Remove a slot |

### Doctors

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/doctors` | all | Search/list doctors |
| GET | `/doctors/:doctorId` | all | Get doctor profile |

### Clinics

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/clinic` | all | List clinic locations |
| POST | `/clinic` | admin | Add clinic location |

### Emergency Requests

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/emergency-requests` | patient | Submit an emergency appointment request |
| GET | `/emergency-requests` | doctor/admin | List emergency requests |
| PATCH | `/emergency-requests/:id` | doctor | Accept or reject request |

## Key Features

- **Queue-based booking**: If a time slot is already booked, patients are added to a waiting queue and notified if the slot becomes available.
- **Cancellation fee**: Patients who cancel after payment are charged a 10% cancellation fee.
- **Doctor restrictions**: Doctors can only cancel appointments at least 12 hours before the scheduled time.
- **Notifications**: SMS and email notifications are sent on booking confirmation, status updates, and 10-hour reminders.
- **Availability service**: Doctors can define recurring or one-time time slots which the system exposes to patients.

## Authentication

All routes require a valid JWT bearer token. Role-based access is enforced via `authMiddleware` and `roleMiddleware`.
