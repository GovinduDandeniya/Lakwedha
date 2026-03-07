import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:logger/logger.dart';

final loggerProvider = Provider((ref) => Logger());

const _storage = FlutterSecureStorage();

final dioProvider = Provider((ref) {
  final dio = Dio(
    BaseOptions(
      // Using local IP address for physical iPhone testing on same WiFi
      baseUrl: 'http://172.20.10.12:5000/api',
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
      final token = await _storage.read(key: 'jwt_token');
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
