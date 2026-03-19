import 'dart:convert';
import 'package:http/http.dart' as http;
import '../constants/app_constants.dart';
import '../../data/models/pharmacy_model.dart';

class PharmacyService {
  static const String _base = AppConstants.baseUrl;

  // ── Register ─────────────────────────────────────────────────────────────────
  static Future<Map<String, dynamic>> register({
    required String pharmacyName,
    required String businessRegNumber,
    required String permitNumber,
    required String province,
    required String district,
    required String city,
    required String address,
    required String postalCode,
    required String ownerName,
    required String ownerNIC,
    required String email,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_base${AppConstants.pharmacyRegisterEndpoint}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'pharmacyName': pharmacyName,
          'businessRegNumber': businessRegNumber,
          'permitNumber': permitNumber,
          'province': province,
          'district': district,
          'city': city,
          'address': address,
          'postalCode': postalCode,
          'ownerName': ownerName,
          'ownerNIC': ownerNIC,
          'email': email,
          'password': password,
        }),
      );

      final data = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 201) return data;
      throw data['message'] as String? ?? 'Registration failed. Please try again.';
    } on http.ClientException {
      throw 'Network error. Check your connection.';
    } catch (e) {
      if (e is String) rethrow;
      throw 'Something went wrong. Please try again.';
    }
  }

  // ── Login ─────────────────────────────────────────────────────────────────────
  /// Returns a map with at minimum `status` key.
  /// On approval also includes `token` and `pharmacy`.
  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_base${AppConstants.pharmacyLoginEndpoint}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );

      final data = jsonDecode(response.body) as Map<String, dynamic>;

      // 200 = approved, 403 = pending/rejected, 401 = wrong credentials
      if (response.statusCode == 200 || response.statusCode == 403) return data;
      throw data['message'] as String? ?? 'Login failed. Please try again.';
    } on http.ClientException {
      throw 'Network error. Check your connection.';
    } catch (e) {
      if (e is String) rethrow;
      throw 'Something went wrong. Please try again.';
    }
  }

  // ── Admin: get all pharmacies ─────────────────────────────────────────────────
  static Future<List<PharmacyModel>> getAllPharmacies({String? status}) async {
    try {
      final uri = Uri.parse('$_base${AppConstants.pharmacyAllEndpoint}')
          .replace(queryParameters: status != null ? {'status': status} : null);

      final response = await http.get(uri, headers: {'Content-Type': 'application/json'});
      final data = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200) {
        final list = data['data'] as List<dynamic>;
        return list.map((e) => PharmacyModel.fromJson(e as Map<String, dynamic>)).toList();
      }
      throw data['message'] as String? ?? 'Failed to load pharmacies.';
    } on http.ClientException {
      throw 'Network error. Check your connection.';
    } catch (e) {
      if (e is String) rethrow;
      throw 'Something went wrong. Please try again.';
    }
  }
}
