import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/emergency_center.dart';

class EmergencyApiService {
  static const String _baseUrl = 'http://lakwedha.lk/api/emergency-centers';

  /// Fetch all active emergency centers from the backend
  Future<List<EmergencyCenter>> fetchEmergencyCenters() async {
    final response = await http.get(
      Uri.parse(_baseUrl),
      headers: {'Content-Type': 'application/json'},
    );

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

  /// Fetch nearby emergency centers based on user coordinates
  Future<List<EmergencyCenter>> fetchNearbyCenters({
    required double latitude,
    required double longitude,
    double radiusKm = 50,
  }) async {
    final uri = Uri.parse('$_baseUrl/nearby').replace(
      queryParameters: {
        'lat': latitude.toString(),
        'lng': longitude.toString(),
        'radius': radiusKm.toString(),
      },
    );

    final response = await http.get(
      uri,
      headers: {'Content-Type': 'application/json'},
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final List<dynamic> centersJson = data is List ? data : data['data'] ?? [];
      return centersJson
          .map((json) => EmergencyCenter.fromJson(json))
          .toList();
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
