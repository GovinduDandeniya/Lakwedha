import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../constants/app_constants.dart';

class NotificationService {
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;

  /// Returns true only on platforms that support FCM push.
  bool get _isSupportedPlatform =>
      defaultTargetPlatform == TargetPlatform.android ||
      defaultTargetPlatform == TargetPlatform.iOS;

  /// Call this once after a successful login, passing the JWT bearer token.
  Future<void> initNotifications(String userToken) async {
    // FCM push is only available on Android and iOS
    if (!_isSupportedPlatform) return;

    // Request permission (required on iOS; harmless on Android)
    await _firebaseMessaging.requestPermission();

    // Get this device's FCM token
    final String? fcmToken = await _firebaseMessaging.getToken();
    if (fcmToken == null) return;

    debugPrint('FCM TOKEN: $fcmToken');

    // Send token to backend so the server can push to this device
    await http.post(
      Uri.parse('${AppConstants.baseUrl}${AppConstants.saveTokenEndpoint}'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $userToken',
      },
      body: jsonEncode({'token': fcmToken}),
    );
  }
}
