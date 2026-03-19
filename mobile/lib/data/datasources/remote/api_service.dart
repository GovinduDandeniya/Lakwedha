import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/constants/app_constants.dart';
import '../../models/doctor_model.dart';
import '../../models/availability_model.dart';
import '../../models/appointment_model.dart';
import '../../models/doctor_availability_model.dart';


class ApiService {
    // ===================== DOCTOR AVAILABILITY RESULT =====================
    Future<DoctorAvailabilityResult> getDoctorAvailabilityResult(String doctorId) async {
      String url = '${AppConstants.baseUrl}${AppConstants.availabilityEndpoint}/doctor/$doctorId/summary';
      final response = await http.get(Uri.parse(url), headers: await _getHeaders());
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return DoctorAvailabilityResult.fromJson(data['data']);
      }
      throw Exception('Failed to load doctor availability summary');
    }
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(AppConstants.tokenKey);

    final headers = {'Content-Type': 'application/json'};
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  // ===================== AUTH =====================
  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('${AppConstants.baseUrl}${AppConstants.loginEndpoint}'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'email': email, 'password': password}),
    );

    final data = json.decode(response.body);
    if (response.statusCode == 200) return data;
    throw Exception(data['error'] ?? 'Login failed');
  }

  // ===================== AUTH - CHANGE PASSWORD =====================
  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    final response = await http.post(
      Uri.parse('${AppConstants.baseUrl}${AppConstants.changePasswordEndpoint}'),
      headers: await _getHeaders(),
      body: json.encode({
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      }),
    );
    if (response.statusCode != 200) {
      final data = json.decode(response.body);
      throw Exception(data['error'] ?? 'Failed to change password');
    }
  }

  // ===================== DOCTOR =====================
  Future<List<Doctor>> searchDoctors({
    String? specialty,
    String? location,
    double? lat,
    double? lng,
  }) async {
    String url = '${AppConstants.baseUrl}${AppConstants.doctorsEndpoint}';
    final queryParams = <String, String>{};

    if (specialty != null) queryParams['specialty'] = specialty;
    if (location != null) queryParams['location'] = location;
    if (lat != null) queryParams['lat'] = lat.toString();
    if (lng != null) queryParams['lng'] = lng.toString();
    if (queryParams.isNotEmpty) url += '?${Uri(queryParameters: queryParams).query}';

    final response = await http.get(Uri.parse(url), headers: await _getHeaders());
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final List doctorsList = (data['data'] ?? data['doctors'] ?? []) as List;
      return doctorsList.map((json) => Doctor.fromJson(json)).toList();
    }
    throw Exception('Failed to load doctors');
  }

  // ===================== AVAILABILITY =====================
  Future<List<Availability>> getDoctorAvailability(
    String doctorId, {
    DateTime? fromDate,
    DateTime? toDate,
  }) async {
    String url =
        '${AppConstants.baseUrl}${AppConstants.availabilityEndpoint}/doctor/$doctorId';
    final queryParams = <String, String>{};
    if (fromDate != null) queryParams['fromDate'] = fromDate.toIso8601String();
    if (toDate != null) queryParams['toDate'] = toDate.toIso8601String();
    if (queryParams.isNotEmpty) url += '?${Uri(queryParameters: queryParams).query}';

    final response = await http.get(Uri.parse(url), headers: await _getHeaders());
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final List availabilities = (data['data'] ?? []) as List;
      return availabilities.map((json) => Availability.fromJson(json)).toList();
    }
    throw Exception('Failed to load availability');
  }

  // ===================== APPOINTMENTS =====================
  Future<Map<String, dynamic>> bookAppointment({
    required String doctorId,
    required String slotId,
    String? symptoms,
  }) async {
    final response = await http.post(
      Uri.parse('${AppConstants.baseUrl}${AppConstants.bookAppointmentEndpoint}'),
      headers: await _getHeaders(),
      body: json.encode({'doctorId': doctorId, 'slotId': slotId, 'symptoms': symptoms ?? ''}),
    );

    final data = json.decode(response.body);
    if (response.statusCode == 201 || response.statusCode == 202) {
      return {
        'success': true,
        'inQueue': response.statusCode == 202,
        'data': data['data'],
        'queuePosition': data['queuePosition'],
        'message': data['message'],
      };
    }
    throw Exception(data['error'] ?? 'Booking failed');
  }

  Future<Map<String, List<Appointment>>> getAppointmentHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final userRole = prefs.getString(AppConstants.userRoleKey) ?? 'patient';

    final response = await http.get(
      Uri.parse('${AppConstants.baseUrl}${AppConstants.appointmentHistoryEndpoint}?role=$userRole'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final upcomingList = (data['data']?['upcoming'] as List?) ?? [];
      final pastList = (data['data']?['past'] as List?) ?? [];
      return {
        'upcoming': upcomingList.map((json) => Appointment.fromJson(json)).toList(),
        'past': pastList.map((json) => Appointment.fromJson(json)).toList(),
      };
    }
    throw Exception('Failed to load appointment history');
  }

  Future<Appointment> updateAppointmentStatus(
    String appointmentId,
    String status, {
    String? reason,
  }) async {
    final response = await http.patch(
      Uri.parse('${AppConstants.baseUrl}${AppConstants.doctorChannelingBase}/appointments/$appointmentId/status'),
      headers: await _getHeaders(),
      body: json.encode({'status': status, if (reason != null) 'reason': reason}),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return Appointment.fromJson(data['data']);
    }
    throw Exception('Failed to update appointment status');
  }

  Future<Map<String, dynamic>> getQueueStatus(String slotId) async {
    final response = await http.get(
      Uri.parse('${AppConstants.baseUrl}${AppConstants.doctorChannelingBase}/appointments/queue/$slotId'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['data'] ?? {};
    }
    throw Exception('Failed to get queue status');
  }

  // ===================== PATIENT NOTIFICATIONS =====================
  Future<List<Map<String, dynamic>>> getPatientNotifications() async {
    final response = await http.get(
      Uri.parse('${AppConstants.baseUrl}${AppConstants.patientNotificationsEndpoint}'),
      headers: await _getHeaders(),
    );
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final List list = (data['data'] ?? []) as List;
      return list.cast<Map<String, dynamic>>();
    }
    throw Exception('Failed to load notifications');
  }

  Future<void> markNotificationRead(int id) async {
    await http.patch(
      Uri.parse('${AppConstants.baseUrl}${AppConstants.patientNotificationsEndpoint}/$id/read'),
      headers: await _getHeaders(),
    );
  }

  Future<void> markAllNotificationsRead() async {
    await http.patch(
      Uri.parse('${AppConstants.baseUrl}${AppConstants.patientNotificationsEndpoint}/read-all'),
      headers: await _getHeaders(),
    );
  }

  // ===================== FORGOT PASSWORD =====================

  /// Step 1 – send OTP to email or phone.
  /// Returns { success, maskedValue, message } on success.
  Future<Map<String, dynamic>> forgotPasswordSendOtp({
    required String method, // 'email' | 'phone'
    required String value,
  }) async {
    final response = await http.post(
      Uri.parse('${AppConstants.baseUrl}${AppConstants.fpSendOtpEndpoint}'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'method': method, 'value': value}),
    );
    final data = json.decode(response.body) as Map<String, dynamic>;
    if (response.statusCode == 200) return data;
    throw ForgotPasswordException(
      data['message'] as String? ?? 'Failed to send OTP.',
      waitSeconds: data['waitSeconds'] as int?,
    );
  }

  /// Step 2 – verify OTP.
  /// Returns { success, resetToken } on success.
  Future<Map<String, dynamic>> forgotPasswordVerifyOtp({
    required String method,
    required String value,
    required String otp,
  }) async {
    final response = await http.post(
      Uri.parse('${AppConstants.baseUrl}${AppConstants.fpVerifyOtpEndpoint}'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'method': method, 'value': value, 'otp': otp}),
    );
    final data = json.decode(response.body) as Map<String, dynamic>;
    if (response.statusCode == 200) return data;
    throw ForgotPasswordException(
      data['message'] as String? ?? 'Invalid OTP.',
      remainingAttempts: data['remainingAttempts'] as int?,
    );
  }

  /// Step 3 – reset password using the JWT reset token.
  Future<void> forgotPasswordReset({
    required String resetToken,
    required String newPassword,
  }) async {
    final response = await http.post(
      Uri.parse('${AppConstants.baseUrl}${AppConstants.fpResetPasswordEndpoint}'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'resetToken': resetToken, 'new_password': newPassword}),
    );
    if (response.statusCode != 200) {
      final data = json.decode(response.body) as Map<String, dynamic>;
      throw ForgotPasswordException(
        data['message'] as String? ?? 'Reset failed.',
      );
    }
  }
}

/// Typed exception for forgot-password errors, carrying optional metadata.
class ForgotPasswordException implements Exception {
  final String message;
  final int? waitSeconds;
  final int? remainingAttempts;
  const ForgotPasswordException(this.message, {this.waitSeconds, this.remainingAttempts});

  @override
  String toString() => message;
}