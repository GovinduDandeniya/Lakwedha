# Lakwedha

Lakwedha is a digital Ayurvedic doctor channeling system that allows patients to find government-verified Ayurvedic doctors, book appointments, and receive notifications.

---

## Project Structure

```
Lakwedha-develop/
├── backend/          Node.js + Express API server
│   └── src/
│       ├── server.js            ← single entry point (npm start)
│       ├── routes/              patient auth, forgot-password, registration
│       ├── controllers/
│       ├── models/
│       ├── doctor-channeling/   appointment & availability sub-system
│       ├── middleware/
│       └── .env                 environment variables (copy from below)
│
├── mobile/           Flutter patient app
│   └── lib/
│       ├── core/constants/app_constants.dart   base URL + endpoints
│       └── data/datasources/remote/api_service.dart
│
└── web/
    ├── src/          Next.js admin panel
    └── doctor-portal/  React doctor portal
```

---

## Backend

### Required Environment Variables

Create / update `backend/src/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://admin:Admin123@lakwedha.i8uzmqo.mongodb.net/lakwedha
JWT_SECRET=lakwedha_jwt_secret_2026
```

> `MONGODB_URI` must be set — the server will exit on startup if it is missing.

### Run

```bash
cd backend
npm install
npm start        # production  (node src/server.js)
npm run dev      # development (nodemon src/server.js)
```

Server starts on **http://localhost:5000**

---

## API Base URL

All routes are namespaced under `/api/v1/` (or `/api/` for legacy auth routes):

| Group | Prefix |
|---|---|
| Patient auth | `/api/users/` |
| OTP registration | `/api/auth/` |
| Forgot password | `/api/forgot-password/` |
| Doctor registration | `/api/v1/doctors/` |
| Doctor portal auth | `/api/v1/auth/` |
| Doctor channeling | `/api/v1/doctor-channeling/` |
| Channeling sessions | `/api/v1/channeling-sessions/` |
| Patient notifications | `/api/v1/patient-notifications/` |
| Dashboard | `/api/v1/dashboard/` |

---

## Key API Endpoints

### Patient Auth
```
POST /api/users/register              register patient
POST /api/users/login                 login → JWT token
POST /api/users/change-password       change password (requires Bearer token)
GET  /api/users/profile               get profile (requires Bearer token)
```

### OTP Registration
```
POST /api/auth/send-otp
POST /api/auth/verify-otp
POST /api/auth/register
```

### Forgot Password
```
POST /api/forgot-password/send-otp
POST /api/forgot-password/verify-otp
POST /api/forgot-password/reset-password
```

### Doctor Channeling (patient-facing)
```
GET  /api/v1/doctor-channeling/doctors            search doctors
GET  /api/v1/doctor-channeling/availability/doctor/:id  availability slots
POST /api/v1/doctor-channeling/appointments/book  book appointment
GET  /api/v1/doctor-channeling/appointments/history  appointment history
```

### Patient Notifications
```
GET   /api/v1/patient-notifications              get notifications
PATCH /api/v1/patient-notifications/:id/read     mark one as read
PATCH /api/v1/patient-notifications/read-all     mark all as read
```

---

## Mobile App (Flutter)

### Base URL

Configured in `mobile/lib/core/constants/app_constants.dart`:

```dart
static const String baseUrl = 'http://10.0.2.2:5000'; // Android emulator
// Use 'http://127.0.0.1:5000' for iOS simulator
// Use your LAN IP (e.g. http://192.168.1.x:5000) for a physical device
```

### Run

```bash
cd mobile
flutter pub get
flutter run
```

---

## Doctor Portal (React)

```bash
cd web/doctor-portal
npm install
npm start     # http://localhost:3000
```

Default API base: `http://localhost:5000/api/v1` (set `REACT_APP_API_URL` in `.env` to override).

---

## Admin Panel (Next.js)

```bash
cd web
npm install
npm run dev   # http://localhost:3000
```

---

## End-to-End Flow

1. Patient registers via OTP (`/api/auth/*`)
2. Patient logs in, receives JWT (`/api/users/login`)
3. Patient searches doctors (`/api/v1/doctor-channeling/doctors`)
4. Patient books appointment (`/api/v1/doctor-channeling/appointments/book`)
5. Doctor logs in to doctor portal (`/api/v1/auth/login`)
6. Doctor manages sessions & appointments via dashboard
7. If doctor cancels a session, patients receive notifications (`/api/v1/patient-notifications`)
