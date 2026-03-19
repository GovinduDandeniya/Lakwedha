class PharmacyModel {
  final String id;
  final String pharmacyName;
  final String businessRegNumber;
  final String permitNumber;
  final String province;
  final String district;
  final String city;
  final String address;
  final String postalCode;
  final String ownerName;
  final String ownerNIC;
  final String email;
  final String status;
  final String? rejectionReason;

  const PharmacyModel({
    required this.id,
    required this.pharmacyName,
    required this.businessRegNumber,
    required this.permitNumber,
    required this.province,
    required this.district,
    required this.city,
    required this.address,
    required this.postalCode,
    required this.ownerName,
    required this.ownerNIC,
    required this.email,
    required this.status,
    this.rejectionReason,
  });

  factory PharmacyModel.fromJson(Map<String, dynamic> json) {
    return PharmacyModel(
      id: json['id'] as String? ?? json['_id'] as String? ?? '',
      pharmacyName: json['pharmacyName'] as String? ?? '',
      businessRegNumber: json['businessRegNumber'] as String? ?? '',
      permitNumber: json['permitNumber'] as String? ?? '',
      province: json['province'] as String? ?? '',
      district: json['district'] as String? ?? '',
      city: json['city'] as String? ?? '',
      address: json['address'] as String? ?? '',
      postalCode: json['postalCode'] as String? ?? '',
      ownerName: json['ownerName'] as String? ?? '',
      ownerNIC: json['ownerNIC'] as String? ?? '',
      email: json['email'] as String? ?? '',
      status: json['status'] as String? ?? 'pending',
      rejectionReason: json['rejectionReason'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'pharmacyName': pharmacyName,
        'businessRegNumber': businessRegNumber,
        'permitNumber': permitNumber,
        'province': province,
        'district': district,
        'city': city,
        'address': address,
        'postalCode': postalCode,
        'ownerName': ownerName,
        'ownerNIC': ownerNIC,
        'email': email,
        'status': status,
        if (rejectionReason != null) 'rejectionReason': rejectionReason,
      };
}
