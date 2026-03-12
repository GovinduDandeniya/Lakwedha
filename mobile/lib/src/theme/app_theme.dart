import 'package:flutter/material.dart';

class AppTheme {
  // New Palette
  static const Color primaryColor = Color(0xFF0D5C3E);
  static const Color secondaryColor = Color(0xFFD4AF37);
  static const Color accentColor = Color(0xFF28A745);
  static const Color emergencyColor = Color(0xFFDC3545);
  static const Color backgroundColor = Color(0xFFF8F9FA);

  // Standard Colors
  static const Color white = Colors.white;
  static const Color black = Colors.black;
  static const Color background = backgroundColor;
  static const Color error = emergencyColor;

  // Overall Theme Data
  static ThemeData get themeData {
    return ThemeData(
      colorScheme: ColorScheme.fromSeed(seedColor: primaryColor),
      useMaterial3: true,
      scaffoldBackgroundColor: backgroundColor,
      appBarTheme: const AppBarTheme(
        backgroundColor: primaryColor,
        foregroundColor: white,
        elevation: 0,
      ),
    );
  }
}
