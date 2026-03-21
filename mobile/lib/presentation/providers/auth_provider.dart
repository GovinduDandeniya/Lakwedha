import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../data/datasources/remote/api_service.dart';
import '../../core/constants/app_constants.dart';
import '../../core/services/notification_service.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  bool _isLoading = false;
  String? _error;
  String? _token;
  Map<String, dynamic>? _user;
  String? _profileImagePath;
  bool _isGuest = false;
  bool _isSuspended = false;

  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get token => _token;
  Map<String, dynamic>? get user => _user;
  bool get isAuthenticated => _token != null;
  bool get isGuest => _isGuest;
  bool get isSuspended => _isSuspended;
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

  Future<bool> register({
    required String name,
    required String email,
    required String password,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _apiService.register(name: name, email: email, password: password);
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

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    _isSuspended = false;
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

      // Fetch full profile (birthday, nic_number, etc.) and merge
      final fullProfile = await _apiService.fetchProfile();
      if (fullProfile != null) {
        _user!.addAll(fullProfile);
      }

      // Load any locally saved overrides
      await _loadLocalOverrides(prefs);

      // Register FCM token with backend (non-blocking)
      NotificationService().initNotifications(_token!).catchError((_) {});

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      _isSuspended = _error!.toLowerCase().contains('suspended');
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
    final savedToken = prefs.getString(AppConstants.tokenKey);

    if (savedToken != null && savedToken.isNotEmpty) {
      // Temporarily set the token so _getHeaders() includes it for validation
      _token = savedToken;
      final isValid = await _apiService.validateToken();
      if (isValid) {
        final fullProfile = await _apiService.fetchProfile();
        if (fullProfile != null) {
          _user ??= {};
          _user!.addAll(fullProfile);
          if (fullProfile['status'] == 'suspended') {
            _isSuspended = true;
            _token = null;
            await prefs.remove(AppConstants.tokenKey);
            await prefs.remove(AppConstants.userIdKey);
            await prefs.remove(AppConstants.userRoleKey);
          }
        }
        if (!_isSuspended) await _loadLocalOverrides(prefs);
      } else {
        // Token expired or invalid — clear everything
        _token = null;
        await prefs.remove(AppConstants.tokenKey);
        await prefs.remove(AppConstants.userIdKey);
        await prefs.remove(AppConstants.userRoleKey);
      }
    }

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
