import 'package:flutter/material.dart';
import 'doctor_model.dart';

/// =========================
/// ENUMS
/// =========================

enum AppointmentStatus {
  pending,
  confirmed,
  completed,
  cancelled,
  cancelRequested,
  rescheduled,
  noShow,
}

extension AppointmentStatusExtension on AppointmentStatus {
  String get value {
    switch (this) {
      case AppointmentStatus.pending:
        return 'pending';
      case AppointmentStatus.confirmed:
        return 'confirmed';
      case AppointmentStatus.completed:
        return 'completed';
      case AppointmentStatus.cancelled:
        return 'cancelled';
      case AppointmentStatus.cancelRequested:
        return 'cancel_requested';
      case AppointmentStatus.rescheduled:
        return 'rescheduled';
      case AppointmentStatus.noShow:
        return 'no-show';
    }
  }

  String get display {
    switch (this) {
      case AppointmentStatus.pending:
        return 'Pending';
      case AppointmentStatus.confirmed:
        return 'Confirmed';
      case AppointmentStatus.completed:
        return 'Completed';
      case AppointmentStatus.cancelled:
        return 'Cancelled';
      case AppointmentStatus.cancelRequested:
        return 'Cancel Requested';
      case AppointmentStatus.rescheduled:
        return 'Rescheduled';
      case AppointmentStatus.noShow:
        return 'No Show';
    }
  }

  Color get color {
    switch (this) {
      case AppointmentStatus.pending:
        return Colors.orange;
      case AppointmentStatus.confirmed:
        return Colors.green;
      case AppointmentStatus.completed:
        return Colors.blue;
      case AppointmentStatus.cancelled:
        return Colors.red;
      case AppointmentStatus.cancelRequested:
        return Colors.deepOrange;
      case AppointmentStatus.rescheduled:
        return Colors.purple;
      case AppointmentStatus.noShow:
        return Colors.grey;
    }
  }

  static AppointmentStatus fromString(String? status) {
    switch (status) {
      case 'confirmed':
        return AppointmentStatus.confirmed;
      case 'completed':
        return AppointmentStatus.completed;
      case 'cancelled':
        return AppointmentStatus.cancelled;
      case 'cancel_requested':
        return AppointmentStatus.cancelRequested;
      case 'rescheduled':
        return AppointmentStatus.rescheduled;
      case 'no-show':
        return AppointmentStatus.noShow;
      default:
        return AppointmentStatus.pending;
    }
  }
}

/// =========================
/// APPOINTMENT MODEL
/// =========================

class Appointment {
  final String id;
  final String appointmentId;
  final String doctorId;
  final String patientId;
  final DateTime slotTime;
  AppointmentStatus status;
  int? queuePosition;
  String? symptoms;
  String? notes;
  String? cancellationReason;
  String? rescheduledFrom;
  String paymentStatus;
  final DateTime createdAt;
  DateTime updatedAt;

  // Populated fields
  Doctor? doctorDetails;
  PatientInfo? patientDetails;

  Appointment({
    required this.id,
    required this.appointmentId,
    required this.doctorId,
    required this.patientId,
    required this.slotTime,
    required this.status,
    this.queuePosition,
    this.symptoms,
    this.notes,
    this.cancellationReason,
    this.rescheduledFrom,
    required this.paymentStatus,
    required this.createdAt,
    required this.updatedAt,
    this.doctorDetails,
    this.patientDetails,
  });

  factory Appointment.fromJson(Map<String, dynamic> json) {
    return Appointment(
      id: json['_id'] ?? '',
      appointmentId: json['appointmentId'] ?? '',
      doctorId: json['doctorId'] is Map
          ? json['doctorId']['_id'] ?? ''
          : json['doctorId'] ?? '',
      patientId: json['patientId'] is Map
          ? json['patientId']['_id'] ?? ''
          : json['patientId'] ?? '',
      slotTime: json['slotTime'] != null
          ? DateTime.parse(json['slotTime'])
          : DateTime.now(),
      status: AppointmentStatusExtension.fromString(json['status']),
      queuePosition: json['queuePosition'],
      symptoms: json['symptoms'],
      notes: json['notes'],
      cancellationReason: json['cancellationReason'],
      rescheduledFrom: json['rescheduledFrom'],
      paymentStatus: json['paymentStatus'] ?? 'pending',
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : DateTime.now(),
      doctorDetails: json['doctorId'] is Map
          ? Doctor.fromJson(json['doctorId'])
          : null,
      patientDetails: json['patientId'] is Map
          ? PatientInfo.fromJson(json['patientId'])
          : null,
    );
  }
}

/// =========================
/// PATIENT MODEL
/// =========================

class PatientInfo {
  final String id;
  final String name;
  final int age;
  final String gender;

  PatientInfo({
    required this.id,
    required this.name,
    required this.age,
    required this.gender,
  });

  factory PatientInfo.fromJson(Map<String, dynamic> json) {
    return PatientInfo(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      age: json['age'] ?? 0,
      gender: json['gender'] ?? '',
    );
  }
}