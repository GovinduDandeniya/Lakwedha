import 'medication_model.dart';

class Prescription {
  final String? id;
  final String patientId;
  final String? doctorName;
  final List<Medication> medications;
  final String? notes;
  final String? fileUrl;
  final DateTime? issuedDate;

  Prescription({
    this.id,
    required this.patientId,
    this.doctorName,
    required this.medications,
    this.notes,
    this.fileUrl,
    this.issuedDate,
  });

  factory Prescription.fromJson(Map<String, dynamic> json) {
