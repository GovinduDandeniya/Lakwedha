import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:http/http.dart' as http;
import '../models/emr_model.dart';
import '../utils/api_constants.dart';

class EmrService {
  final Dio _dio = Dio();

  /// Fetch EMR records for the authenticated patient
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
    }
  }

  /// Upload a medical record (doctor only).
  /// [patientId]    MongoDB ObjectId of the patient
  /// [type]         One of: prescription | file | text | medical_record | camera
  /// [title]        Human-readable record title
  /// [diagnosis]    Optional diagnosis text (AES-encrypted on server)
  /// [notes]        Optional notes/prescription text (AES-encrypted on server)
  /// [appointmentId] Optional linked appointment ObjectId
  /// [file]         Optional file attachment (image or PDF)
  /// [token]        Doctor's JWT token
  Future<void> uploadEMRRecord({
    required String patientId,
    required String type,
    required String title,
    String? diagnosis,
    String? notes,
    String? appointmentId,
    File? file,
    required String token,
  }) async {
    final formData = FormData.fromMap({
      'patientId': patientId,
      'type': type,
      'title': title.isEmpty ? type : title,
      'uploadedDate': DateTime.now().toIso8601String().substring(0, 10),
      if (diagnosis != null && diagnosis.isNotEmpty) 'diagnosis': diagnosis,
      if (notes != null && notes.isNotEmpty) 'notes': notes,
      if (appointmentId != null && appointmentId.isNotEmpty) 'appointmentId': appointmentId,
      if (file != null)
        'file': await MultipartFile.fromFile(
          file.path,
          filename: file.path.split(Platform.pathSeparator).last,
        ),
    });

    final response = await _dio.post(
      '${ApiConstants.baseUrl}/emr/upload',
      data: formData,
      options: Options(
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'multipart/form-data',
        },
        receiveTimeout: const Duration(seconds: 30),
        sendTimeout: const Duration(seconds: 30),
      ),
    );

    if (response.statusCode != 200 && response.statusCode != 201) {
      final msg = response.data is Map ? response.data['error'] ?? response.data['message'] : 'Upload failed';
      throw Exception(msg);
    }
  }
}
