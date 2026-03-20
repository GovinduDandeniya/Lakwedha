class DateSlotSummary {
  final String? sessionId; // ChannelingSession _id — used for booking
  final String date;       // 'YYYY-MM-DD'
  final String startTime;  // 'HH:MM'
  final String endTime;    // 'HH:MM'
  final int totalSlots;
  final int bookedSlots;

  const DateSlotSummary({
    this.sessionId,
    required this.date,
    required this.startTime,
    required this.endTime,
    required this.totalSlots,
    required this.bookedSlots,
  });

  int get availableSlots => totalSlots - bookedSlots;

  String get status {
    if (availableSlots == 0) return 'full';
    if (availableSlots <= 5) return 'limited';
    return 'available';
  }
}

class HospitalAvailability {
  final String hospitalId;
  final String hospitalName;
  final String location;
  final List<DateSlotSummary> dates;

  const HospitalAvailability({
    required this.hospitalId,
    required this.hospitalName,
    required this.location,
    required this.dates,
  });

  factory HospitalAvailability.fromJson(Map<String, dynamic> json) {
    final sessions = (json['sessions'] as List).cast<Map<String, dynamic>>();

    // Key by date+startTime so each session slot is a separate bookable row.
    // Two entries with identical date+startTime are the same release and get
    // their slot counts summed (keeps the first session_id).
    final byKey = <String, Map<String, dynamic>>{};
    for (final s in sessions) {
      final key = '${s['date']}|${s['start_time']}';
      if (byKey.containsKey(key)) {
        byKey[key]!['total_slots'] =
            (byKey[key]!['total_slots'] as int) + (s['total_slots'] as int);
        byKey[key]!['booked_slots'] =
            (byKey[key]!['booked_slots'] as int) + (s['booked_slots'] as int);
      } else {
        byKey[key] = Map<String, dynamic>.from(s);
      }
    }

    final dates = byKey.entries
        .map((e) => DateSlotSummary(
              sessionId: e.value['session_id'] as String?,
              date: e.key.split('|')[0],
              startTime: e.value['start_time'] as String,
              endTime: e.value['end_time'] as String,
              totalSlots: e.value['total_slots'] as int,
              bookedSlots: e.value['booked_slots'] as int,
            ))
        .toList()
      ..sort((a, b) => '${a.date}|${a.startTime}'.compareTo('${b.date}|${b.startTime}'));

    return HospitalAvailability(
      hospitalId: json['hospital_id'] as String,
      hospitalName: json['hospital_name'] as String,
      location: json['location'] as String? ?? '',
      dates: dates,
    );
  }
}

class DoctorAvailabilityResult {
  final String doctorId;
  final String doctorName;
  final String specialization;
  final String? qualification;
  final bool isVerified;
  final List<HospitalAvailability> hospitals;

  const DoctorAvailabilityResult({
    required this.doctorId,
    required this.doctorName,
    required this.specialization,
    this.qualification,
    required this.isVerified,
    required this.hospitals,
  });

  factory DoctorAvailabilityResult.fromJson(Map<String, dynamic> json) {
    final doc = json['doctor'] as Map<String, dynamic>;
    return DoctorAvailabilityResult(
      doctorId: doc['id'] as String,
      doctorName: doc['name'] as String,
      specialization: doc['specialization'] as String? ?? '',
      qualification: doc['qualification'] as String?,
      isVerified: doc['is_verified'] as bool? ?? false,
      hospitals: (json['hospitals'] as List)
          .map((h) => HospitalAvailability.fromJson(h as Map<String, dynamic>))
          .toList(),
    );
  }
}
