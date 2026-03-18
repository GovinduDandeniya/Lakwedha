import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../data/datasources/remote/api_service.dart';
import '../../core/constants/app_constants.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  bool _isLoading = false;
  String? _error;
  String? _token;
  Map<String, dynamic>? _user;
  String? _profileImagePath;
  bool _isGuest = false;

  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get token => _token;
  Map<String, dynamic>? get user => _user;
  bool get isAuthenticated => _token != null;
  bool get isGuest => _isGuest;
  String? get profileImagePath => _profileImagePath;

  static const String _profileImageKey = 'profile_image_path';
  static const String _firstNameKey    = 'user_firstName';
  static const String _lastNameKey     = 'user_lastName';
  static const String _emailEditKey    = 'user_email_edit';

  /// Sets the provider into guest mode (no token, no account).
  void continueAsGuest() {
    _isGuest = true;
    _token = null;
    _user  = null;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.login(email, password);

      _token   = response['token'];
      _isGuest = false;
      _user = Map<String, dynamic>.from(response['user'] ?? {});

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(AppConstants.tokenKey, _token!);
      await prefs.setString(AppConstants.userIdKey, _user!['id'] ?? _user!['_id'] ?? '');
      await prefs.setString(AppConstants.userRoleKey, _user!['role'] ?? 'patient');
      await prefs.setString(AppConstants.userKey, _user.toString());

      // Load any locally saved overrides
      await _loadLocalOverrides(prefs);

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

  /// Update name + email locally and notify UI immediately.
  Future<void> updateProfile({
    required String firstName,
    required String lastName,
    required String email,
  }) async {
    _user ??= {};
    _user!['firstName'] = firstName;
    _user!['lastName']  = lastName;
    _user!['email']     = email;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_firstNameKey, firstName);
    await prefs.setString(_lastNameKey,  lastName);
    await prefs.setString(_emailEditKey, email);

    notifyListeners();
  }

  /// Save profile image path locally.
  Future<void> setProfileImage(String path) async {
    _profileImagePath = path;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_profileImageKey, path);
    notifyListeners();
  }

  /// Change password via backend API.
  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _apiService.changePassword(
        currentPassword: currentPassword,
        newPassword: newPassword,
      );
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _error = e.toString().replaceFirst('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.tokenKey);
    await prefs.remove(AppConstants.userIdKey);
    await prefs.remove(AppConstants.userRoleKey);
    await prefs.remove(_profileImageKey);
    await prefs.remove(_firstNameKey);
    await prefs.remove(_lastNameKey);
    await prefs.remove(_emailEditKey);

    _token = null;
    _user  = null;
    _profileImagePath = null;
    _isGuest = false;
    notifyListeners();
  }

  Future<void> checkAuthStatus() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString(AppConstants.tokenKey);
    await _loadLocalOverrides(prefs);
    notifyListeners();
  }

  Future<void> _loadLocalOverrides(SharedPreferences prefs) async {
    _profileImagePath = prefs.getString(_profileImageKey);

    final savedFirst = prefs.getString(_firstNameKey);
    final savedLast  = prefs.getString(_lastNameKey);
    final savedEmail = prefs.getString(_emailEditKey);

    _user ??= {};
    if (savedFirst != null) _user!['firstName'] = savedFirst;
    if (savedLast  != null) _user!['lastName']  = savedLast;
    if (savedEmail != null) _user!['email']      = savedEmail;
  }
}
