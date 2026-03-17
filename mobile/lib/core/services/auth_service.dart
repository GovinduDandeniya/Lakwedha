import 'dart:convert';
import 'package:http/http.dart' as http;

class AuthService {
  // URL
  static const String _baseUrl = 'http:lakwedha.lk/api/users';

  // Login 
  static Future<Map<String, dynamic>> login({
    required String credential,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': credential,
          'password': password,
        }),
      );

      final data = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200) {
        return data;
      } else {
        throw data['message'] as String? ?? 'Invalid credentials. Please try again.';
      }
    } on http.ClientException {
      throw 'Network error. Check your connection.';
    } catch (e) {
      if (e is String) rethrow;
      throw 'Something went wrong. Please try again.';
    }
  }

  // Register
  static Future<void> register({
    required String name,
    required String email,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'name': name,
          'email': email,
          'password': password,
        }),
      );

      final data = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode != 200 && response.statusCode != 201) {
        throw data['message'] as String? ?? 'Registration failed. Please try again.';
      }
    } on http.ClientException {
      throw 'Network error. Check your connection.';
    } catch (e) {
      if (e is String) rethrow;
      throw 'Something went wrong. Please try again.';
    }
  }
    
}