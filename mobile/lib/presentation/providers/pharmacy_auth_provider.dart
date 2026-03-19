import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants/app_constants.dart';
import '../../core/services/pharmacy_service.dart';
import '../../data/models/pharmacy_model.dart';

enum PharmacyAuthStatus { unknown, unauthenticated, pending, rejected, approved }

class PharmacyAuthProvider extends ChangeNotifier {
  PharmacyAuthStatus _status = PharmacyAuthStatus.unknown;
  PharmacyModel? _pharmacy;
  String? _token;
  String? _rejectionReason;
  bool _loading = false;
  String? _error;

  PharmacyAuthStatus get status => _status;
  PharmacyModel?     get pharmacy => _pharmacy;
  String?            get token => _token;
  String?            get rejectionReason => _rejectionReason;
  bool               get loading => _loading;
  String?            get error => _error;

  // ── Bootstrap from persisted token ───────────────────────────────────────────
  Future<void> loadFromStorage() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(AppConstants.pharmacyTokenKey);
    final dataJson = prefs.getString(AppConstants.pharmacyDataKey);

    if (token != null && dataJson != null) {
      _token = token;
      _pharmacy = PharmacyModel.fromJson(
        jsonDecode(dataJson) as Map<String, dynamic>,
      );
      _status = PharmacyAuthStatus.approved;
    } else {
      _status = PharmacyAuthStatus.unauthenticated;
    }
    notifyListeners();
  }

  // ── Register ──────────────────────────────────────────────────────────────────
  Future<bool> register({
    required String pharmacyName,
    required String businessRegNumber,
    required String permitNumber,
    required String province,
    required String district,
    required String city,
    required String address,
    required String postalCode,
    required String ownerName,
    required String ownerNIC,
    required String email,
    required String password,
  }) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      await PharmacyService.register(
        pharmacyName: pharmacyName,
        businessRegNumber: businessRegNumber,
        permitNumber: permitNumber,
        province: province,
        district: district,
        city: city,
        address: address,
        postalCode: postalCode,
        ownerName: ownerName,
        ownerNIC: ownerNIC,
        email: email,
        password: password,
      );
      _status = PharmacyAuthStatus.pending;
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  // ── Login ─────────────────────────────────────────────────────────────────────
  Future<void> login({
    required String email,
    required String password,
  }) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await PharmacyService.login(email: email, password: password);
      final loginStatus = data['status'] as String? ?? '';

      switch (loginStatus) {
        case 'pending':
          _status = PharmacyAuthStatus.pending;
          break;
        case 'rejected':
          _status = PharmacyAuthStatus.rejected;
          _rejectionReason = data['reason'] as String?;
          break;
        case 'approved':
          _token = data['token'] as String?;
          final pharmacyJson = data['pharmacy'] as Map<String, dynamic>?;
          if (pharmacyJson != null) {
            _pharmacy = PharmacyModel.fromJson(pharmacyJson);
          }
          _status = PharmacyAuthStatus.approved;
          await _persist();
          break;
        default:
          _error = data['message'] as String? ?? 'Login failed.';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────────────
  Future<void> logout() async {
    _token = null;
    _pharmacy = null;
    _rejectionReason = null;
    _status = PharmacyAuthStatus.unauthenticated;

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.pharmacyTokenKey);
    await prefs.remove(AppConstants.pharmacyDataKey);

    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  // ── Persist approved session ──────────────────────────────────────────────────
  Future<void> _persist() async {
    if (_token == null || _pharmacy == null) return;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.pharmacyTokenKey, _token!);
    await prefs.setString(AppConstants.pharmacyDataKey, jsonEncode(_pharmacy!.toJson()));
  }
}
