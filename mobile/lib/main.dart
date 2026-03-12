import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ravana_app/src/screens/pharmacy_hub_screen.dart';
import 'package:ravana_app/src/screens/payment_selection_screen.dart';
import 'package:ravana_app/src/screens/order_tracking_screen.dart';
import 'package:ravana_app/src/core/api_client.dart';

// ---------------------------------------------------------------
// TEMPORARY SUPER ROUTER — DO NOT COMMIT
// Used for testing all screens on the Chrome/iPhone sequentially.
// ---------------------------------------------------------------

void main() {
  // Catch & display framework-level errors instead of silently crashing
  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
  };

  runApp(
    const ProviderScope(
      child: LakwedhaTestApp(),
    ),
  );
}

class LakwedhaTestApp extends StatelessWidget {
  const LakwedhaTestApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Lakwedha — Test Mode',
      debugShowCheckedModeBanner: true,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2E7D32)),
        useMaterial3: true,
      ),
      home: const TestNavigationHub(),
    );
  }
}

class TestNavigationHub extends ConsumerWidget {
  const TestNavigationHub({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFA),
      appBar: AppBar(
        title: const Text('Lakwedha Dev Hub'),
        backgroundColor: const Color(0xFF2E7D32),
        foregroundColor: Colors.white,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'Test Screens',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 30),
            _NavButton(
              label: '1. Pharmacy Hub',
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const PharmacyHubScreen()),
              ),
            ),
            const SizedBox(height: 16),
            _NavButton(
              label: '2. Payment Selection',
              onTap: () async {
                try {
                  final dio = ref.read(dioProvider);
                  final res = await dio.get('/orders');
                  final orders = res.data['data'] as List;
                  if (orders.isEmpty) return;
                  final realId = orders.first['_id'].toString();

                  if (context.mounted) {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => PaymentSelectionScreen(orderId: realId),
                      ),
                    );
                  }
                } catch (e) {
                  debugPrint('Failed to fetch orders: $e');
                }
              },
            ),
            const SizedBox(height: 16),
            _NavButton(
              label: '3. Order Tracking',
              onTap: () async {
                try {
                  final dio = ref.read(dioProvider);
                  final res = await dio.get('/orders');
                  final orders = res.data['data'] as List;
                  if (orders.isEmpty) return;
                  final realId = orders.first['_id'].toString();

                  if (context.mounted) {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => OrderTrackingScreen(orderId: realId),
                      ),
                    );
                  }
                } catch (e) {
                  debugPrint('Failed to fetch orders: $e');
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _NavButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const _NavButton({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 300,
      child: ElevatedButton(
        onPressed: onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF2E7D32),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: Text(label, style: const TextStyle(fontSize: 16)),
      ),
    );
  }
}
