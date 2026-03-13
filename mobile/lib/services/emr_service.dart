import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/emr_model.dart';
import '../utils/api_constants.dart';

class EmrService {
  Future<List<Emr>> fetchPatientEmrs(String token) async {
