import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ravana_app/src/screens/pharmacy_finder_screen.dart';
import 'package:ravana_app/src/screens/patient_orders_screen.dart';
import 'package:ravana_app/src/theme/app_theme.dart';

import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:flutter/foundation.dart';

/**
 * Lakwedha Mobile Application
 * Strictly Patient-Facing UI.
 * Pharmacists must use the official Web Dashboard Hub.
 */
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Stripe initialization with robust cross-platform safety
  if (!kIsWeb && (defaultTargetPlatform == TargetPlatform.android || defaultTargetPlatform == TargetPlatform.iOS)) {
    // Standard Lakwedha test credentials
    Stripe.publishableKey = 'pk_test_51TD60sAKmmVI8wbJk2zah53I30D0zadI4wAnaBSEtqWzAHLaIpPlUfM8PTTWD5aff9CnEU61i4xUt0VnIzMEcT10002jnqLI8Q';
    await Stripe.instance.applySettings();
  }

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
      theme: ThemeData(
        useMaterial3: true,
        fontFamily: 'Outfit',
      ),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: Stack(
        children: [
          // Background Decoration
          Positioned(
            top: -100,
            right: -100,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppTheme.primaryColor.withOpacity(0.2),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ).animate().fadeIn(duration: 1000.ms),

          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Spacer(),
                  
                  // Brand Icon
                  Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(40),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.primaryColor.withOpacity(0.15),
                          blurRadius: 40,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: const Center(
                      child: Icon(Icons.spa_rounded, color: AppTheme.primaryColor, size: 60),
                    ),
                  ).animate().scale(duration: 600.ms, curve: Curves.elasticOut),

                  const SizedBox(height: 32),
                  
                  const Text(
                    'Lakwedha',
                    style: TextStyle(
                      fontSize: 48,
                      fontWeight: FontWeight.w900,
                      color: AppTheme.secondaryColor,
                      letterSpacing: -1.5,
                    ),
                  ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2, end: 0),
                  
                  const SizedBox(height: 8),
                  
                  const Text(
                    'Pure Ayurvedic Healing.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey,
                      fontStyle: FontStyle.italic,
                    ),
                  ).animate(delay: 400.ms).fadeIn(),

                  const Spacer(),

                  _HomeButton(
                    title: 'Find Pharmacies',
                    subtitle: 'Locate nearby Ayurvedic experts',
                    icon: Icons.location_on_rounded,
                    color: AppTheme.primaryColor,
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) => const PharmacyFinderScreen()),
                      );
                    },
                  ).animate(delay: 600.ms).fadeIn().slideY(begin: 0.2, end: 0),

                  const SizedBox(height: 16),

                  _HomeButton(
                    title: 'Orders & Payments',
                    subtitle: 'Track and pay for your medicines',
                    icon: Icons.receipt_long_rounded,
                    color: AppTheme.accentColor,
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) => const PatientOrdersScreen()),
                      );
                    },
                  ).animate(delay: 650.ms).fadeIn().slideY(begin: 0.2, end: 0),

                  const Spacer(),

                  const Text(
                    'SECURE • AYURVEDIC • MOBILE',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 3,
                      color: Colors.grey,
                    ),
                  ).animate(delay: 1000.ms).fadeIn(),
                  
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _HomeButton extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback onPressed;

  const _HomeButton({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.mediumImpact();
        onPressed();
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.2),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, color: Colors.white, size: 28),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.7),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white, size: 16),
          ],
        ),
      ),
    );
  }
}
