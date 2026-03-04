import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/constants/app_constants.dart';
import '../../models/doctor_model.dart';
import '../../models/availability_model.dart';
import '../../models/appointment_model.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  /// =========================
  /// HEADERS
  /// =========================
  Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(AppConstants.tokenKey);

    final headers = {
      'Content-Type': 'application/json',
    };

    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }

    return headers;
  }

  /// =========================
  /// AUTH METHODS
  /// =========================
  Future<Map<String, dynamic>> login(
      String email, String password) async {
    final response = await http.post(
      Uri.parse(
          '${AppConstants.baseUrl}${AppConstants.loginEndpoint}'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'email': email,
        'password': password,
      }),
    );

    final data = json.decode(response.body);

    if (response.statusCode == 200) {
      return data;
    } else {
      throw Exception(data['error'] ?? 'Login failed');
    }
  }

  /// =========================
  /// DOCTOR METHODS
  /// =========================
  Future<List<Doctor>> searchDoctors({
    String? specialty,
    String? location,
    double? lat,
    double? lng,
  }) async {
    String url =
        '${AppConstants.baseUrl}${AppConstants.doctorsEndpoint}';

    final queryParams = <String, String>{};

    if (specialty != null) queryParams['specialty'] = specialty;
    if (location != null) queryParams['location'] = location;
    if (lat != null) queryParams['lat'] = lat.toString();
    if (lng != null) queryParams['lng'] = lng.toString();

    if (queryParams.isNotEmpty) {
      url += '?${Uri(queryParameters: queryParams).query}';
    }

    final response = await http.get(
      Uri.parse(url),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final List doctorsList =
          (data['data'] ?? data['doctors'] ?? []) as List;

      return doctorsList
          .map((item) => Doctor.fromJson(item))
          .toList();
    } else {
      throw Exception('Failed to load doctors');
    }
  }

  /// =========================
  /// AVAILABILITY METHODS
  /// =========================
  Future<List<Availability>> getDoctorAvailability(
    String doctorId, {
    DateTime? fromDate,
    DateTime? toDate,
  }) async {
    String url =
        '${AppConstants.baseUrl}${AppConstants.availabilityEndpoint}/doctor/$doctorId';

    final queryParams = <String, String>{};

    if (fromDate != null) {
      queryParams['fromDate'] = fromDate.toIso8601String();
    }

    if (toDate != null) {
      queryParams['toDate'] = toDate.toIso8601String();
    }

    if (queryParams.isNotEmpty) {
      url += '?${Uri(queryParameters: queryParams).query}';
    }

    final response = await http.get(
      Uri.parse(url),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final List availabilityList =
          (data['data'] ?? []) as List;

      return availabilityList
          .map((item) => Availability.fromJson(item))
          .toList();
    } else {
      throw Exception('Failed to load availability');
    }
  }

  /// =========================
  /// BOOK APPOINTMENT
  /// =========================
  Future<Map<String, dynamic>> bookAppointment({
    required String doctorId,
    required String slotId,
    String? symptoms,
  }) async {
    final response = await http.post(
      Uri.parse(
          '${AppConstants.baseUrl}${AppConstants.bookAppointmentEndpoint}'),
      headers: await _getHeaders(),
      body: json.encode({
        'doctorId': doctorId,
        'slotId': slotId,
        'symptoms': symptoms ?? '',
      }),
    );

    final data = json.decode(response.body);

    if (response.statusCode == 200 ||
        response.statusCode == 201 ||
        response.statusCode == 202) {
      return {
        'success': true,
        'inQueue': response.statusCode == 202,
        'data': data['data'],
        'queuePosition': data['queuePosition'],
        'message': data['message'],
      };
    } else {
      throw Exception(data['error'] ?? 'Booking failed');
    }
  }

  /// =========================
  /// APPOINTMENT HISTORY
  /// =========================
  Future<Map<String, List<Appointment>>>
      getAppointmentHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final userRole =
        prefs.getString(AppConstants.userRoleKey) ?? 'patient';

    final response = await http.get(
      Uri.parse(
          '${AppConstants.baseUrl}${AppConstants.appointmentHistoryEndpoint}?role=$userRole'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);

      final upcomingList =
          (data['data']?['upcoming'] as List?) ?? [];
      final pastList =
          (data['data']?['past'] as List?) ?? [];

      final upcoming = upcomingList
          .map((item) => Appointment.fromJson(item))
          .toList();

      final past = pastList
          .map((item) => Appointment.fromJson(item))
          .toList();

      return {
        'upcoming': upcoming,
        'past': past,
      };
    } else {
      throw Exception(
          'Failed to load appointment history');
    }
  }

  /// =========================
  /// UPDATE APPOINTMENT STATUS
  /// =========================
  Future<Appointment> updateAppointmentStatus(
    String appointmentId,
    String status, {
    String? reason,
  }) async {
    final response = await http.patch(
      Uri.parse(
          '${AppConstants.baseUrl}${AppConstants.appointmentStatusEndpoint}/$appointmentId/status'),
      headers: await _getHeaders(),
      body: json.encode({
        'status': status,
        if (reason != null) 'reason': reason,
      }),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return Appointment.fromJson(data['data']);
    } else {
      throw Exception(
          'Failed to update appointment status');
    }
  }

  /// =========================
  /// QUEUE STATUS
  /// =========================
  Future<Map<String, dynamic>> getQueueStatus(
      String slotId) async {
    final response = await http.get(
      Uri.parse(
          '${AppConstants.baseUrl}${AppConstants.queueStatusEndpoint}/$slotId'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['data'] ?? {};
    } else {
      throw Exception('Failed to get queue status');
    }
  }
}