import 'package:flutter/material.dart';
import '../../data/models/appointment_model.dart';
import '../../data/datasources/remote/api_service.dart';

class AppointmentProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  bool _isLoading = false;
  String? _error;
  List<Appointment> _upcomingAppointments = [];
  List<Appointment> _pastAppointments = [];

  bool get isLoading => _isLoading;
  String? get error => _error;
  List<Appointment> get upcomingAppointments => _upcomingAppointments;
  List<Appointment> get pastAppointments => _pastAppointments;

  Future<void> loadAppointments() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _apiService.getAppointmentHistory();
      _upcomingAppointments = result['upcoming'] ?? [];
      _pastAppointments = result['past'] ?? [];
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }


  Future<Map<String, dynamic>?> getQueueStatus(String slotId) async {
    try {
      return await _apiService.getQueueStatus(slotId);
    } catch (e) {
      return null;
    }
  }

  Future<String?> requestCancellation(String appointmentId, String reason) async {
    try {
      await _apiService.requestCancellation(appointmentId, reason);
      await loadAppointments();
      return null; // success
    } catch (e) {
      return e.toString();
    }
  }

  /// Returns null on success, or an error message string on failure.
  Future<String?> submitExtraRequest({
    required String sessionId,
    required String reason,
    String? urgencyNote,
  }) async {
    try {
      await _apiService.submitExtraRequest(
        sessionId: sessionId,
        reason: reason,
        urgencyNote: urgencyNote,
      );
      return null;
    } catch (e) {
      return e.toString().replaceFirst('Exception: ', '');
    }
  }
}