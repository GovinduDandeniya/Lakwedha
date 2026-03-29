import 'package:flutter/foundation.dart' show kIsWeb, defaultTargetPlatform, TargetPlatform;
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:logger/logger.dart';
import '../../core/constants/app_constants.dart';

final loggerProvider = Provider((ref) => Logger());

// ---------------------------------------------------------------------------
// Web-safe token storage
// On web, FlutterSecureStorage is not available — use a simple in-memory map.
// This is fine for testing purposes. For production, use a cookie-based store.
// ---------------------------------------------------------------------------
abstract class _TokenStorage {
  Future<String?> read(String key);
  Future<void> write(String key, String value);
}

class _WebTokenStorage implements _TokenStorage {
  @override
  Future<String?> read(String key) async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(key);
  }

  @override
  Future<void> write(String key, String value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(key, value);
  }
}

// Always use SharedPreferences — auth_provider.dart writes the token there on all platforms.
final _tokenStorage = _WebTokenStorage() as _TokenStorage;

// ---------------------------------------------------------------------------
// Base URL
// Resolved from --dart-define=API_URL=http://<host>:5000 at build time.
// Defaults:
//   Web / Windows desktop → http://localhost:5000
//   Android emulator      → http://10.0.2.2:5000  (routes to host machine)
//   Physical device       → pass --dart-define=API_URL=http://192.168.x.x:5000
// ---------------------------------------------------------------------------
String _baseUrl() {
  if (kIsWeb || defaultTargetPlatform == TargetPlatform.windows) {
    return 'https://lakwedha.onrender.com';
  }
  return String.fromEnvironment('API_URL', defaultValue: 'https://lakwedha.onrender.com');
}

final dioProvider = Provider((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: _baseUrl(),
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ),
  );

  final logger = ref.read(loggerProvider);

  dio.interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) async {
      logger.i('REQUEST[${options.method}] => PATH: ${options.path}');

      // Inject Authorization token
      final token = await _tokenStorage.read(AppConstants.tokenKey);
      if (token != null && token.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $token';
      }

      return handler.next(options);
    },
    onResponse: (response, handler) {
      logger.i('RESPONSE[${response.statusCode}] => DATA: ${response.data}');
      return handler.next(response);
    },
    onError: (DioException e, handler) {
      logger.e('ERROR[${e.response?.statusCode}] => MESSAGE: ${e.message}');
      return handler.next(e);
    },
  ));

  return dio;
});
