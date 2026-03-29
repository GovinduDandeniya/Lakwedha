import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../constants/app_constants.dart';

class AuthService {
  // URL
  static const String _baseUrl = '${AppConstants.baseUrl}/api/v1/users';

  // Login
  static Future<Map<String, dynamic>> login({
    required String credential,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': credential,
          'password': password,
        }),
      ).timeout(const Duration(seconds: 60));

      final data = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200) {
        return data;
      } else {
        throw data['message'] as String? ?? 'Invalid credentials. Please try again.';
      }
    } on SocketException {
      throw 'Cannot reach server. Make sure the backend is running.';
    } on TimeoutException {
      throw 'Connection timed out. Check your network and try again.';
    } catch (e) {
      if (e is String) rethrow;
      throw 'Something went wrong. Please try again.';
    }
  }

  // Register
  static Future<void> register({
    required String name,
    required String email,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'name': name,
          'email': email,
          'password': password,
        }),
      ).timeout(const Duration(seconds: 60));

      final data = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode != 200 && response.statusCode != 201) {
        throw data['message'] as String? ?? 'Registration failed. Please try again.';
      }
    } on SocketException {
      throw 'Cannot reach server. Make sure the backend is running.';
    } on TimeoutException {
      throw 'Connection timed out. Check your network and try again.';
    } catch (e) {
      if (e is String) rethrow;
      throw 'Something went wrong. Please try again.';
    }
  }

  // ── Registration OTP flow ────────────────────────────────────────────────

  /// Send OTP to phone for registration.
  /// Returns the full response map (contains `maskedPhone`).
  static Future<Map<String, dynamic>> sendRegistrationOtp({
    required String phone,
    required String countryCode,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}${AppConstants.regSendOtpEndpoint}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'phone': phone, 'country_code': countryCode}),
      ).timeout(const Duration(seconds: 60));
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode == 200) return data;
      throw data['message'] as String? ?? 'Failed to send OTP.';
    } on SocketException {
      throw 'Cannot reach server. Make sure the backend is running.';
    } on TimeoutException {
      throw 'Connection timed out. Check your network and try again.';
    } catch (e) {
      if (e is String) rethrow;
      throw 'Something went wrong. Please try again.';
    }
  }

  /// Verify OTP and return the short-lived `verifyToken`.
  static Future<String> verifyRegistrationOtp({
    required String phone,
    required String countryCode,
    required String otp,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}${AppConstants.regVerifyOtpEndpoint}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'phone': phone, 'country_code': countryCode, 'otp': otp}),
      ).timeout(const Duration(seconds: 60));
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode == 200) {
        return data['verifyToken'] as String;
      }
      throw data['message'] as String? ?? 'Invalid OTP.';
    } on SocketException {
      throw 'Cannot reach server. Make sure the backend is running.';
    } on TimeoutException {
      throw 'Connection timed out. Check your network and try again.';
    } catch (e) {
      if (e is String) rethrow;
      throw 'Something went wrong. Please try again.';
    }
  }

  /// Complete registration with verified phone token.
  static Future<void> registerWithOtp({
    required String verifyToken,
    required String title,
    required String firstName,
    required String lastName,
    required String nationality,
    required String phone,
    required String countryCode,
    required String email,
    required String birthday,
    required String nicType,
    required String nicNumber,
    required String password,
    required String province,
    required String district,
    required String city,
    required String address,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}${AppConstants.regRegisterEndpoint}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'verifyToken': verifyToken,
          'title': title,
          'first_name': firstName,
          'last_name': lastName,
          'nationality': nationality,
          'phone': phone,
          'country_code': countryCode,
          'email': email,
          'birthday': birthday,
          'nic_type': nicType,
          'nic_number': nicNumber,
          'password': password,
          'province': province,
          'district': district,
          'city': city,
          'address': address,
        }),
      ).timeout(const Duration(seconds: 20));
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode != 200 && response.statusCode != 201) {
        throw data['message'] as String? ?? 'Registration failed.';
      }
    } on SocketException {
      throw 'Cannot reach server. Make sure the backend is running.';
    } on TimeoutException {
      throw 'Connection timed out. Check your network and try again.';
    } catch (e) {
      if (e is String) rethrow;
      throw 'Something went wrong. Please try again.';
    }
  }
}