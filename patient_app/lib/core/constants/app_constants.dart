import 'package:flutter/material.dart';

class AppConstants {
  // API Base URL - Change this to your backend URL
  static const String baseUrl = 'http://192.168.1.100:5000/api/v1';

  // API Endpoints
  static const String loginEndpoint = '/auth/login';
  static const String registerEndpoint = '/auth/register';
  static const String doctorsEndpoint = '/doctors';
  static const String availabilityEndpoint = '/doctor-channeling/availability';
  static const String bookAppointmentEndpoint = '/doctor-channeling/appointments/book';
  static const String appointmentHistoryEndpoint = '/doctor-channeling/appointments/history';

  // Shared Preferences Keys
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  static const String userIdKey = 'user_id';
  static const String userRoleKey = 'user_role';

  // Colors
  static const Color primaryColor = Color(0xFF0D5C3E);
  static const Color secondaryColor = Color(0xFFD4AF37);
  static const Color accentColor = Color(0xFF28A745);
  static const Color emergencyColor = Color(0xFFDC3545);
  static const Color backgroundColor = Color(0xFFF8F9FA);
}