import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ravana_app/src/screens/pharmacy_hub_screen.dart';
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
    return const MaterialApp(
      title: 'Lakwedha',
      debugShowCheckedModeBanner: false,
      home: PharmacyHubScreen(),
    );
  }
}
