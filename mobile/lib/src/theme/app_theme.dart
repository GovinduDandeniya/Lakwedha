import 'package:flutter/material.dart';

class AppTheme {
  // Herbal Greens
  static const Color herbal = Color(0xFF2E7D32); // Green 800
  static const Color herbalDeep = Color(0xFF1B5E20); // Green 900

  // Earth Tones
  static const Color earth = Color(0xFF5D4037); // Brown 700
  static const Color earthLight = Color(0xFF8D6E63); // Brown 400

  // Turmeric Yellows
  static const Color turmeric = Color(0xFFF9A825); // Yellow 800
  static const Color turmericDeep = Color(0xFFF57F17); // Yellow 900

  // Neutrals (Sand & Clay)
  static const Color sand = Color(0xFFF5F5DC); // Beige
  static const Color clay = Color(0xFFBCAAA4); // Brown 200

  // Standard Colors
  static const Color white = Colors.white;
  static const Color black = Colors.black;
  static const Color background = Color(0xFFFAFAFA);
  static const Color error = Color(0xFFD32F2F);

  // Overall Theme Data
  static ThemeData get themeData {
    return ThemeData(
      colorScheme: ColorScheme.fromSeed(seedColor: herbal),
      useMaterial3: true,
      scaffoldBackgroundColor: background,
      appBarTheme: const AppBarTheme(
        backgroundColor: herbal,
        foregroundColor: white,
        elevation: 0,
      ),
    );
  }
}
