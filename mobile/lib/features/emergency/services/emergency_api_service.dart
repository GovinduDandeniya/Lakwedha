import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/emergency_center.dart';
import '../../../core/constants/app_constants.dart';

class EmergencyApiService {
  static const String _baseUrl = '${AppConstants.baseUrl}/api/emergency-centers';

  /// Fetch the list of Ayurveda-treatable emergency types from the backend
  Future<List<String>> fetchEmergencyTypes() async {
    final response = await http.get(
      Uri.parse('$_baseUrl/types'),
      headers: {'Content-Type': 'application/json'},
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final List<dynamic> typesJson = data['data'] ?? [];
      return typesJson.map((e) => e.toString()).toList();
    } else {
      throw Exception('Failed to load emergency types');
    }
  }

  /// Fetch all active emergency centers, optionally filtered by emergency type
  Future<List<EmergencyCenter>> fetchEmergencyCenters({String? emergencyType}) async {
    final uri = Uri.parse(_baseUrl).replace(
      queryParameters: emergencyType != null ? {'emergencyType': emergencyType} : null,
    );
    final response = await http.get(uri, headers: {'Content-Type': 'application/json'});

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final List<dynamic> centersJson = data is List ? data : data['data'] ?? [];
      return centersJson
          .map((json) => EmergencyCenter.fromJson(json))
          .where((center) => center.isActive)
          .toList();
    } else {
      throw Exception('Failed to load emergency centers');
    }
  }

  /// Fetch nearby centers sorted by distance, optionally filtered by emergency type
  Future<List<EmergencyCenter>> fetchNearbyCenters({
    required double latitude,
    required double longitude,
    double radiusKm = 50,
    String? emergencyType,
  }) async {
    final params = <String, String>{
      'lat': latitude.toString(),
      'lng': longitude.toString(),
      'radius': radiusKm.toString(),
      if (emergencyType != null) 'emergencyType': emergencyType,
    };
    final uri = Uri.parse('$_baseUrl/nearby').replace(queryParameters: params);
    final response = await http.get(uri, headers: {'Content-Type': 'application/json'});

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final List<dynamic> centersJson = data is List ? data : data['data'] ?? [];
      return centersJson.map((json) => EmergencyCenter.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load nearby emergency centers');
    }
  }

  /// Fetch a single emergency center by ID
  Future<EmergencyCenter> fetchCenterById(String id) async {
    final response = await http.get(
      Uri.parse('$_baseUrl/$id'),
      headers: {'Content-Type': 'application/json'},
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final centerData = data['data'] ?? data;
      return EmergencyCenter.fromJson(centerData);
    } else {
      throw Exception('Emergency center not found');
    }
  }
}
