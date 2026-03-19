import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/pharmacy_auth_provider.dart';

class PharmacyPendingScreen extends StatelessWidget {
  const PharmacyPendingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.read<PharmacyAuthProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF0F4F8),
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Illustration
                Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF8E1),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.orange.withAlpha(51),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.hourglass_empty_rounded,
                    size: 60,
                    color: Color(0xFFF59E0B),
                  ),
                ),
                const SizedBox(height: 32),

                const Text(
                  'Registration Under Review',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF1F2937),
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Your registration is under review.\nPlease wait for admin approval.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 15,
                    color: Colors.grey,
                    height: 1.6,
                  ),
                ),
                const SizedBox(height: 16),

                // Status chip
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFF59E0B)),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.access_time,
                          size: 16, color: Color(0xFFD97706)),
                      SizedBox(width: 6),
                      Text(
                        'Status: Pending Approval',
                        style: TextStyle(
                          color: Color(0xFFD97706),
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 48),

                // Info card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withAlpha(10),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.info_outline,
                          color: Color(0xFF0D5C3E), size: 20),
                      SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'We will notify you once your application has been reviewed. This usually takes 1–2 business days.',
                          style: TextStyle(
                            fontSize: 13,
                            color: Color(0xFF4B5563),
                            height: 1.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 40),

                // Logout button
                OutlinedButton.icon(
                  onPressed: () async {
                    await provider.logout();
                    if (context.mounted) {
                      Navigator.of(context)
                          .pushReplacementNamed('/pharmacy/login');
                    }
                  },
                  icon: const Icon(Icons.logout, color: Color(0xFF0D5C3E)),
                  label: const Text(
                    'Logout',
                    style: TextStyle(
                      color: Color(0xFF0D5C3E),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(double.infinity, 48),
                    side: const BorderSide(color: Color(0xFF0D5C3E)),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
