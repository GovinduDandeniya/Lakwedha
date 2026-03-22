import 'dart:convert';
import 'package:http/http.dart' as http;
import '../utils/api_constants.dart';

class Hospital {
  final String id;
  final String name;
  final String location;
  final String city;
  final String type; // 'hospital' | 'clinic'
  final double adminCharge;
  final bool isActive;

  Hospital({
    required this.id,
    required this.name,
    required this.location,
    required this.city,
    required this.type,
    required this.adminCharge,
    required this.isActive,
  });

  factory Hospital.fromJson(Map<String, dynamic> json) {
    return Hospital(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      location: json['location'] ?? '',
      city: json['city'] ?? '',
      type: json['type'] ?? 'hospital',
      adminCharge: (json['adminCharge'] ?? 0).toDouble(),
      isActive: json['isActive'] ?? true,
    );
  }
}

class HospitalService {
  /// Fetch active hospitals/clinics (admin-managed master list)
  Future<List<Hospital>> fetchHospitals() async {
    final response = await http.get(
      Uri.parse('${ApiConstants.baseUrl}/hospitals'),
      headers: {'Content-Type': 'application/json'},
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => Hospital.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load hospitals: ${response.statusCode}');
    }
  }
}
