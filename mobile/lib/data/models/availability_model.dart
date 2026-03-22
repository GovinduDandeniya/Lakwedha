class TimeSlot {
  final String id;
  final String startTime;
  final String endTime;
  bool isBooked;
  String? bookedBy;
  int queuePosition;
  String status;

  TimeSlot({
    required this.id,
    required this.startTime,
    required this.endTime,
    this.isBooked = false,
    this.bookedBy,
    this.queuePosition = 0,
    this.status = 'available',
  });

  factory TimeSlot.fromJson(Map<String, dynamic> json) {
    return TimeSlot(
      id: json['_id'] ?? '',
      startTime: json['startTime'] ?? '',
      endTime: json['endTime'] ?? '',
      isBooked: json['isBooked'] ?? false,
      bookedBy: json['bookedBy'],
      queuePosition: json['queuePosition'] ?? 0,
      status: json['status'] ?? 'available',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'startTime': startTime,
      'endTime': endTime,
      'isBooked': isBooked,
      'bookedBy': bookedBy,
      'queuePosition': queuePosition,
      'status': status,
    };
  }

  bool get isAvailable => !isBooked && status == 'available';

  String get displayTime {
    final parts = startTime.split(':');
    final hour = int.parse(parts[0]);
    final minute = parts[1];
    final period = hour >= 12 ? 'PM' : 'AM';
    final displayHour = hour == 0 ? 12 : (hour > 12 ? hour - 12 : hour);
    return '$displayHour:$minute $period';
  }
}

class Availability {
  final String id;
  final String doctorId;
  final DateTime date;
  final List<TimeSlot> slots;
  final List<Break> breaks;
  final bool isRecurring;

  Availability({
    required this.id,
    required this.doctorId,
    required this.date,
    required this.slots,
    required this.breaks,
    this.isRecurring = false,
  });

  factory Availability.fromJson(Map<String, dynamic> json) {
    return Availability(
      id: json['_id'] ?? '',
      doctorId: json['doctorId'] ?? '',
      date: DateTime.parse(json['date']),
      slots: (json['slots'] as List? ?? [])
          .map((slot) => TimeSlot.fromJson(slot))
          .toList(),
      breaks: (json['breaks'] as List? ?? [])
          .map((break_) => Break.fromJson(break_))
          .toList(),
      isRecurring: json['isRecurring'] ?? false,
    );
  }

  List<TimeSlot> get availableSlots {
    return slots.where((slot) => slot.isAvailable).toList();
  }
}

class Break {
  final String startTime;
  final String endTime;
  final String reason;

  Break({
    required this.startTime,
    required this.endTime,
    required this.reason,
  });

  factory Break.fromJson(Map<String, dynamic> json) {
    return Break(
      startTime: json['startTime'] ?? '',
      endTime: json['endTime'] ?? '',
      reason: json['reason'] ?? '',
    );
  }
}