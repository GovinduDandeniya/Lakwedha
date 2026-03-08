import 'dart:convert';
import 'package:http/http.dart' as http;

class AuthService {
    static const String _baseUrl = 'http://10.0.2.2:5000/api/users';

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

    } on http.ClientException {
      throw 'Network error. Check your connection.';
    } catch (e) {
      if (e is String) rethrow;
      throw 'Something went wrong. Please try again.';
    }
  }
}