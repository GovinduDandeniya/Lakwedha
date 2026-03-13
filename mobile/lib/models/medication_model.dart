class Medication {
  final String name;
  final String dosage;
  final String duration;

  Medication({
    required this.name,
    required this.dosage,
    required this.duration,
  });

  Map<String, dynamic> toJson() => {
    'name': name,
    'dosage': dosage,
    'duration': duration,
  };

  factory Medication.fromJson(Map<String, dynamic> json) => Medication(
