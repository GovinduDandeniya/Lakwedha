import 'package:flutter/material.dart';
import '../../data/models/availability_model.dart';
import '../../data/models/doctor_model.dart';
import '../../data/datasources/remote/api_service.dart';

class BookingProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  // State
  bool _isLoading = false;
  String? _error;
  Doctor? _selectedDoctor;
  DateTime _selectedDate = DateTime.now();
  List<Availability> _availabilities = [];
  TimeSlot? _selectedSlot;
  Map<String, dynamic>? _bookingResult;

  // Getters
  bool get isLoading => _isLoading;
  String? get error => _error;
  Doctor? get selectedDoctor => _selectedDoctor;
  DateTime get selectedDate => _selectedDate;
  List<Availability> get availabilities => _availabilities;
  TimeSlot? get selectedSlot => _selectedSlot;
  Map<String, dynamic>? get bookingResult => _bookingResult;

  List<TimeSlot> get availableSlotsForSelectedDate {
    try {
      final availability = _availabilities.firstWhere(
        (a) =>a.date.year == _selectedDate.year &&
              a.date.month == _selectedDate.month &&
              a.date.day == _selectedDate.day,
      );
      return availability.availableSlots;
    } catch (e) {
      return [];
    }
  }

  // Methods
  void selectDoctor(Doctor doctor) {
    _selectedDoctor = doctor;
    notifyListeners();
  }

  void selectDate(DateTime date) {
    _selectedDate = date;
    _selectedSlot = null;
    notifyListeners();
  }

  void selectSlot(TimeSlot slot) {
    _selectedSlot = slot;
    notifyListeners();
  }

  Future<void> loadDoctorAvailability(String doctorId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _availabilities = await _apiService.getDoctorAvailability(
        doctorId,
        fromDate: DateTime.now(),
        toDate: DateTime.now().add(const Duration(days: 30)),
      );
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> bookAppointment(String symptoms) async {
    if (_selectedDoctor == null || _selectedSlot == null) {
      _error = 'Please select doctor and time slot';
      return false;
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _bookingResult = await _apiService.bookAppointment(
        doctorId: _selectedDoctor!.id,
        slotId: _selectedSlot!.id,
        symptoms: symptoms,
      );

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  void clearBooking() {
    _selectedDoctor = null;
    _selectedDate = DateTime.now();
    _availabilities = [];
    _selectedSlot = null;
    _bookingResult = null;
    _error = null;
    notifyListeners();
  }
}