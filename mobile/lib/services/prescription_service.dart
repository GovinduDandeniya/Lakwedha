import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart'; // Add this package if mapping mime-types
import '../models/prescription_model.dart';
import '../utils/api_constants.dart';
import 'dart:io';

class PrescriptionService {
  Future<Prescription> createPrescription({
    required String patientId,
    required List<Map<String, dynamic>> medications,
    String? notes,
    File? attachedFile,
    required String token,
  }) async {
    final uri = Uri.parse('${ApiConstants.baseUrl}/prescriptions');
    
    // Use http Multipart Request for managing standard data alongside files natively
    var request = http.MultipartRequest('POST', uri);
    request.headers['Authorization'] = 'Bearer $token';

    // Core strings
    request.fields['patientId'] = patientId;
    
    // The backend uses Joi.custom() expecting the array formatted precisely as a JSON string
    request.fields['medications'] = jsonEncode(medications);
    
    if (notes != null && notes.isNotEmpty) {
      request.fields['notes'] = notes;
    }

    // Attach File payload directly converting to buffer payload seamlessly 
    if (attachedFile != null) {
      request.files.add(
        await http.MultipartFile.fromPath(
            'file', 
            attachedFile.path,
        )
      );
    }

    final streamlinedResponse = await request.send();
    final response = await http.Response.fromStream(streamlinedResponse);

    if (response.statusCode == 201) {
      final jsonResponse = jsonDecode(response.body);
      return Prescription.fromJson(jsonResponse['prescription']);
    } else {
      final jsonResponse = jsonDecode(response.body);
      throw Exception(jsonResponse['message'] ?? 'Failed to create prescription');
    }
  }
}

