import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ravana_app/src/screens/pharmacy_hub_screen.dart';
import 'package:ravana_app/src/screens/payment_selection_screen.dart';
import 'package:ravana_app/src/screens/order_tracking_screen.dart';
import 'package:ravana_app/src/core/api_client.dart';

void main() {
  runApp(
    const ProviderScope(
      child: LakwedhaApp(),
    ),
  );
}

class LakwedhaApp extends StatelessWidget {
  const LakwedhaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Lakwedha',
      debugShowCheckedModeBanner: false,
      theme: appTheme,
      // For now, defaulting to Pharmacy Hub as main entry point
      home: const PharmacyHubScreen(),
    );
  }
}
