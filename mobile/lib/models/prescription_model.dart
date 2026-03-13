import 'medication_model.dart';

class Prescription {
  final String? id;
  final String patientId;
  final String? doctorName;
  final List<Medication> medications;
  final String? notes;
  final String? fileUrl;
  final DateTime? issuedDate;

