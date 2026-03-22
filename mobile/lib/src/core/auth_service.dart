import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// AuthService
///
/// Provides centralised JWT read/write for the mobile app.
/// api_client.dart reads the token via this key automatically on every request.
///
/// Usage (for Sandaru's login flow):
///   await AuthService.saveToken(jwtString);
///
/// Usage (on logout):
///   await AuthService.clearToken();
class AuthService {
  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'jwt_token';

  /// Write the JWT token to secure storage after a successful login.
  static Future<void> saveToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }

  /// Read the current JWT token from secure storage.
  static Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }

  /// Delete the JWT token from secure storage on logout or session expiry.
  static Future<void> clearToken() async {
    await _storage.delete(key: _tokenKey);
  }

  /// Returns true if a JWT token is currently stored.
  static Future<bool> isLoggedIn() async {
    final token = await _storage.read(key: _tokenKey);
    return token != null && token.isNotEmpty;
  }
}
