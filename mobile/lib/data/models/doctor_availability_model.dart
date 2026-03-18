class DateSlotSummary {
  final String date;       // 'YYYY-MM-DD'
  final String startTime;  // 'HH:MM'
  final String endTime;    // 'HH:MM'
  final int totalSlots;
  final int bookedSlots;

  const DateSlotSummary({
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

    // Group sessions by date, summing slots for same date
    final byDate = <String, Map<String, dynamic>>{};
    for (final s in sessions) {
      final date = s['date'] as String;
      if (byDate.containsKey(date)) {
        byDate[date]!['total_slots'] =
            (byDate[date]!['total_slots'] as int) + (s['total_slots'] as int);
        byDate[date]!['booked_slots'] =
            (byDate[date]!['booked_slots'] as int) + (s['booked_slots'] as int);
        byDate[date]!['end_time'] = s['end_time'];
      } else {
        byDate[date] = Map<String, dynamic>.from(s);
      }
    }

    final dates = byDate.entries
        .map((e) => DateSlotSummary(
              date: e.key,
              startTime: e.value['start_time'] as String,
              endTime: e.value['end_time'] as String,
              totalSlots: e.value['total_slots'] as int,
              bookedSlots: e.value['booked_slots'] as int,
            ))
        .toList()
      ..sort((a, b) => a.date.compareTo(b.date));

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
