import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/emr_model.dart';
import '../utils/api_constants.dart';

class EmrService {
  Future<List<Emr>> fetchPatientEmrs(String token) async {
    final response = await http.get(
      Uri.parse('${ApiConstants.baseUrl}/emr'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      final Map<String, dynamic> body = json.decode(response.body);
      final List<dynamic> data = body['emrs'] ?? [];
      return data.map((json) => Emr.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load EMR records: ${response.statusCode}');
