class EmergencyCenter {
  final String id;
  final String name;
  final String type;
  final String address;
  final String phone;
  final double latitude;
  final double longitude;
  final bool is24Hours;
  final bool isActive;
  final double? distance;

  EmergencyCenter({
    required this.id,
    required this.name,
    required this.type,
    required this.address,
    required this.phone,
    required this.latitude,
    required this.longitude,
    this.is24Hours = false,
    this.isActive = true,
    this.distance,
  });

  factory EmergencyCenter.fromJson(Map<String, dynamic> json) {
    // Handle nested location object: { type: 'Point', coordinates: [lng, lat] }
    double lat = 0.0;
    double lng = 0.0;

    if (json['location'] != null && json['location']['coordinates'] != null) {
      final coords = json['location']['coordinates'];
      lng = (coords[0] as num).toDouble();
      lat = (coords[1] as num).toDouble();
    } else {
      lat = (json['latitude'] as num?)?.toDouble() ?? 0.0;
      lng = (json['longitude'] as num?)?.toDouble() ?? 0.0;
    }

    return EmergencyCenter(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      type: json['type'] ?? 'ayurvedic_hospital',
      address: json['address'] ?? '',
      phone: json['phone'] ?? '',
      latitude: lat,
      longitude: lng,
      is24Hours: json['is24Hours'] ?? false,
      isActive: json['isActive'] ?? true,
      distance: (json['distance'] as num?)?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'type': type,
      'address': address,
      'phone': phone,
      'latitude': latitude,
      'longitude': longitude,
      'is24Hours': is24Hours,
      'isActive': isActive,
      if (distance != null) 'distance': distance,
    };
  }

  /// Returns a user-friendly label for the center type
  String get typeLabel {
    switch (type) {
      case 'ayurvedic_hospital':
        return 'Ayurvedic Hospital';
      case 'ayurvedic_clinic':
        return 'Ayurvedic Clinic';
      case 'panchakarma_center':
        return 'Panchakarma Center';
      case 'herbal_pharmacy':
        return 'Herbal Pharmacy';
      case 'wellness_center':
        return 'Wellness Center';
      default:
        return type.replaceAll('_', ' ');
    }
  }
}
