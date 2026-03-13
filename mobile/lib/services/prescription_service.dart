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
