class AppConstants {
  // SharedPreferences keys
  static const String tokenKey = 'auth_token';
  static const String userRoleKey = 'user_role';

  // Base URL
  static const String baseUrl = 'http://localhost:3000';

  // Auth endpoints
  static const String loginEndpoint = '/login';

  // Doctor endpoints
  static const String doctorsEndpoint = '/doctor-channeling/doctors';

  // Availability endpoints
  static const String availabilityEndpoint = '/doctor-channeling/availability';

  // Appointment endpoints
  static const String bookAppointmentEndpoint = '/doctor-channeling/appointments/book';
  static const String appointmentHistoryEndpoint = '/doctor-channeling/appointments/history';
  static const String appointmentStatusEndpoint = '/doctor-channeling/appointments';
  static const String queueStatusEndpoint = '/doctor-channeling/appointments/queue';
}
