import 'package:flutter/material.dart';

class AppConstants {
  AppConstants._();

  // ── API Base URL ─────────────────────────────────────────────────────────────
  // Android emulator  → flutter run --dart-define=API_URL=http://10.0.2.2:5000
  // Physical device   → flutter run --dart-define=API_URL=http://192.168.x.x:5000
  // Default fallback is the emulator address for convenience.
  static const String baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:5000',
  );

  // ── Endpoints ────────────────────────────────────────────────────────────────
  static const String loginEndpoint               = '/api/v1/users/login';
  static const String registerEndpoint            = '/api/v1/users/register';
  static const String doctorsEndpoint             = '/api/v1/doctors';
  static const String availabilityEndpoint        = '/api/v1/doctor-channeling/availability';
  static const String bookAppointmentEndpoint     = '/api/v1/doctor-channeling/appointments/book';
  static const String appointmentHistoryEndpoint  = '/api/v1/doctor-channeling/appointments/history';

  // Registration OTP endpoints
  static const String regSendOtpEndpoint    = '/api/v1/auth/send-otp';
  static const String regVerifyOtpEndpoint  = '/api/v1/auth/verify-otp';
  static const String regRegisterEndpoint   = '/api/v1/auth/register';

  // Forgot-password endpoints
  static const String fpSendOtpEndpoint       = '/api/v1/forgot-password/send-otp';
  static const String fpVerifyOtpEndpoint     = '/api/v1/forgot-password/verify-otp';
  static const String fpResetPasswordEndpoint = '/api/v1/forgot-password/reset-password';

  // Patient notifications endpoints
  static const String patientNotificationsEndpoint = '/api/v1/patient-notifications';

  // Doctor channeling base (availability, appointments, doctors, clinic sub-routes)
  static const String doctorChannelingBase = '/api/v1/doctor-channeling';

  // Change password
  static const String changePasswordEndpoint = '/api/v1/users/change-password';

  // Extra appointment requests (session-full requests to doctor)
  static const String extraRequestsEndpoint = '/api/v1/doctor-channeling/appointments/extra-requests';

  // Notifications
  static const String saveTokenEndpoint      = '/api/v1/save-token';
  static const String notificationsEndpoint  = '/api/v1/notifications';

  // Pharmacy registration & auth endpoints
  static const String pharmacyRegisterEndpoint = '/api/v1/pharmacy/register';
  static const String pharmacyLoginEndpoint    = '/api/v1/pharmacy/login';
  static const String pharmacyAllEndpoint      = '/api/v1/pharmacy/all';
  static const String pharmacyApproveEndpoint  = '/api/v1/pharmacy/approve';
  static const String pharmacyRejectEndpoint   = '/api/v1/pharmacy/reject';

  // Pharmacy SharedPreferences keys
  static const String pharmacyTokenKey = 'pharmacy_token';
  static const String pharmacyDataKey  = 'pharmacy_data';

  // ── SharedPreferences keys ───────────────────────────────────────────────────
  static const String tokenKey    = 'auth_token';
  static const String userKey     = 'user_data';
  static const String userIdKey   = 'user_id';
  static const String userRoleKey = 'user_role';

  // ── App colors ───────────────────────────────────────────────────────────────
  static const Color primaryColor   = Color(0xFF0D5C3E);
  static const Color secondaryColor = Color(0xFFD4AF37);
  static const Color accentColor    = Color(0xFF28A745);
  static const Color emergencyColor = Color(0xFFDC3545);
  static const Color backgroundColor = Color(0xFFF8F9FA);
}
