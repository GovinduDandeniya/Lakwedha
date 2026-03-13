class Emr {
  final String? id;
  final String? patientId;
  final String? doctorName;
  final String diagnosis;
  final String treatment;
  final String notes;
  final DateTime? createdAt;

  Emr({
    this.id,
    this.patientId,
    this.doctorName,
    required this.diagnosis,
    required this.treatment,
    required this.notes,
    this.createdAt,
  });

  factory Emr.fromJson(Map<String, dynamic> json) {
