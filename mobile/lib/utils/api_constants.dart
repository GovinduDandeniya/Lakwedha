class ApiConstants {
  // Android emulator  → flutter run --dart-define=API_URL=http://10.0.2.2:5000
  // Physical device   → flutter run --dart-define=API_URL=http://192.168.x.x:5000
  static const String baseUrl = '${String.fromEnvironment('API_URL', defaultValue: 'http://10.0.2.2:5000')}/api';
  
  // Example token holder (In production, use secure storage & state management)
  static String dummyToken = '';
}

// finalize api_constants.dart implementation
