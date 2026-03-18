import 'package:flutter/material.dart';

class AppConstants {
  AppConstants._();

  // ── API Base URL ─────────────────────────────────────────────────────────────
  // Android emulator  → 10.0.2.2  (maps to host machine's localhost)
  // iOS simulator     → 127.0.0.1
  // Physical device   → your machine's LAN IP (e.g. 192.168.1.x)
  static const String baseUrl = 'http://10.0.2.2:5000';

  // ── Endpoints ────────────────────────────────────────────────────────────────
  static const String loginEndpoint               = '/api/users/login';
  static const String registerEndpoint            = '/api/users/register';
  static const String doctorsEndpoint             = '/api/v1/doctors';
  static const String availabilityEndpoint        = '/api/v1/doctor-channeling/availability';
  static const String bookAppointmentEndpoint     = '/api/v1/doctor-channeling/appointments/book';
  static const String appointmentHistoryEndpoint  = '/api/v1/doctor-channeling/appointments/history';

  // Registration OTP endpoints
  static const String regSendOtpEndpoint    = '/api/auth/send-otp';
  static const String regVerifyOtpEndpoint  = '/api/auth/verify-otp';
  static const String regRegisterEndpoint   = '/api/auth/register';

  // Forgot-password endpoints
  static const String fpSendOtpEndpoint     = '/api/forgot-password/send-otp';
  static const String fpVerifyOtpEndpoint   = '/api/forgot-password/verify-otp';
  static const String fpResetPasswordEndpoint = '/api/forgot-password/reset-password';

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
