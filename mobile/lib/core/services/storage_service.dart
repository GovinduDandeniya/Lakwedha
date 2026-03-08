import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  static const _tokenKey = 'auth_token';
  static const _userNameKey = 'user_name';
  static const _isGuestKey = 'is_guest';

  // Save JWT token
  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  // Retrieve stored JWT token
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  // Clear stored token
  static Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }

  // Save user display name
  static Future<void> saveUserName(String name) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userNameKey, name);
  }

  // Get saved user display name
  static Future<String?> getUserName() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_userNameKey);
  }

  // Mark session as guest
  static Future<void> setGuest(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_isGuestKey, value);
  }

  // Check if current session is guest
  static Future<bool> isGuest() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_isGuestKey) ?? false;
  }
}