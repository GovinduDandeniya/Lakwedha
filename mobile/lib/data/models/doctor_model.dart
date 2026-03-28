// lib/features/doctor/data/models/doctor_model.dart
class Doctor {
  final String id;
  final String name;
  final String specialization;
  final String qualification;
  final int experience;
  final double rating;
  final int reviewCount;
  final String? profileImage;
  final String clinicName;
  final String clinicAddress;
  final double? distance;
  final double consultationFee;
  final bool isVerified;

  Doctor({
    required this.id,
    required this.name,
    required this.specialization,
    required this.qualification,
    required this.experience,
    required this.rating,
    required this.reviewCount,
    this.profileImage,
    required this.clinicName,
    required this.clinicAddress,
    this.distance,
    required this.consultationFee,
    required this.isVerified,
  });

  factory Doctor.fromJson(Map<String, dynamic> json) {
    final rawConsultationFee =
        json['consultationFee'] ?? json['consultation_fee'] ?? json['doctor_fee'] ?? 0;

    return Doctor(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ??
          json['fullName'] ??
          ('${json['firstName'] ?? ''} ${json['lastName'] ?? ''}'.trim().isEmpty
              ? ''
              : '${json['firstName'] ?? ''} ${json['lastName'] ?? ''}'.trim()),
      specialization: json['specialization'] ?? '',
      qualification: json['qualification'] ?? '',
      experience: json['experience'] ?? 0,
      rating: (json['rating'] ?? 0).toDouble(),
      reviewCount: json['reviewCount'] ?? 0,
      profileImage: json['profileImage'],
      clinicName: json['clinicName'] ?? '',
      clinicAddress: json['clinicAddress'] ?? '',
      distance: json['distance'] != null ? (json['distance'] as num).toDouble() : null,
      consultationFee: (rawConsultationFee as num).toDouble(),
      isVerified: json['isVerified'] ?? false,
    );
  }
}