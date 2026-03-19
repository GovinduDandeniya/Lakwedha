import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/pharmacy_auth_provider.dart';

class PharmacyRejectedScreen extends StatelessWidget {
  const PharmacyRejectedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PharmacyAuthProvider>();
    final reason = provider.rejectionReason;

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
                    color: const Color(0xFFFEF2F2),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.red.withAlpha(51),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.cancel_outlined,
                    size: 60,
                    color: Color(0xFFEF4444),
                  ),
                ),
                const SizedBox(height: 32),

                const Text(
                  'Registration Rejected',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF1F2937),
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Your registration was rejected by the admin.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 15,
                    color: Colors.grey,
                    height: 1.6,
                  ),
                ),

                // Rejection reason card
                if (reason != null && reason.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFFCA5A5)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.report_outlined,
                                color: Color(0xFFEF4444), size: 18),
                            SizedBox(width: 6),
                            Text(
                              'Reason for Rejection',
                              style: TextStyle(
                                color: Color(0xFFDC2626),
                                fontWeight: FontWeight.w700,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          reason,
                          style: const TextStyle(
                            color: Color(0xFF7F1D1D),
                            fontSize: 14,
                            height: 1.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 40),

                // Edit & Resubmit
                ElevatedButton.icon(
                  onPressed: () {
                    Navigator.of(context)
                        .pushReplacementNamed('/pharmacy/register');
                  },
                  icon: const Icon(Icons.edit_outlined, color: Colors.white),
                  label: const Text(
                    'Edit & Resubmit',
                    style: TextStyle(
                        color: Colors.white, fontWeight: FontWeight.w700),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0D5C3E),
                    minimumSize: const Size(double.infinity, 50),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                  ),
                ),
                const SizedBox(height: 12),

                // Contact Support
                OutlinedButton.icon(
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (_) => AlertDialog(
                        title: const Text('Contact Support'),
                        content: const Text(
                          'For support, please email:\nsupport@lakwedha.lk\n\nor call:\n+94 11 234 5678',
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.of(context).pop(),
                            child: const Text('Close'),
                          ),
                        ],
                      ),
                    );
                  },
                  icon: const Icon(Icons.support_agent_outlined,
                      color: Color(0xFF0D5C3E)),
                  label: const Text(
                    'Contact Support',
                    style: TextStyle(
                      color: Color(0xFF0D5C3E),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(double.infinity, 50),
                    side: const BorderSide(color: Color(0xFF0D5C3E)),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                  ),
                ),
                const SizedBox(height: 12),

                // Logout
                TextButton(
                  onPressed: () async {
                    await provider.logout();
                    if (context.mounted) {
                      Navigator.of(context)
                          .pushReplacementNamed('/pharmacy/login');
                    }
                  },
                  child: const Text(
                    'Logout',
                    style: TextStyle(color: Colors.grey),
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
