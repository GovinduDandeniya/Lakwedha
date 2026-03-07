import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:logger/logger.dart';

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

class _NativeTokenStorage implements _TokenStorage {
  final _storage = const FlutterSecureStorage();

  @override
  Future<String?> read(String key) => _storage.read(key: key);

  @override
  Future<void> write(String key, String value) =>
      _storage.write(key: key, value: value);
}

class _WebTokenStorage implements _TokenStorage {
  final _map = <String, String>{};

  @override
  Future<String?> read(String key) async => _map[key];

  @override
  Future<void> write(String key, String value) async => _map[key] = value;
}

final _tokenStorage = kIsWeb ? _WebTokenStorage() as _TokenStorage : _NativeTokenStorage();

// ---------------------------------------------------------------------------
// Base URL
// On web (Chrome), use localhost. On device, use local network IP.
// ---------------------------------------------------------------------------
String _baseUrl() {
  if (kIsWeb) {
    return 'http://localhost:5000/api';
  }
  // For physical iPhone testing on same WiFi
  return 'http://172.20.10.12:5000/api';
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

      // Inject Authorization token if it exists
      final token = await _tokenStorage.read('jwt_token');
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
