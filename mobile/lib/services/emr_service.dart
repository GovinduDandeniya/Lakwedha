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
