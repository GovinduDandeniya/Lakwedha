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
    String extractDoctorName(dynamic data) {
      if (data == null) return 'Unknown Doctor';
      if (data is Map && data.containsKey('name')) return data['name'];
      return data.toString();
    }

    return Emr(
      id: json['_id'],
      patientId: json['patientId'] is Map ? json['patientId']['_id'] : json['patientId'],
      doctorName: extractDoctorName(json['doctorId']),
      diagnosis: json['diagnosis'] ?? '[Decryption Failed]',
      treatment: json['treatment'] ?? '[Decryption Failed]',
      notes: json['notes'] ?? '[Decryption Failed]',
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
    );
  }
}

