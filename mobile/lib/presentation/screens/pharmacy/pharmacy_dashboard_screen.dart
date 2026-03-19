import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/pharmacy_auth_provider.dart';

class PharmacyDashboardScreen extends StatelessWidget {
  const PharmacyDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PharmacyAuthProvider>();
    final pharmacy = provider.pharmacy;

    return Scaffold(
      backgroundColor: const Color(0xFFF0F4F8),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0D5C3E),
        title: const Text('Pharmacy Dashboard'),
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white),
            tooltip: 'Logout',
            onPressed: () async {
              final confirmed = await showDialog<bool>(
                context: context,
                builder: (_) => AlertDialog(
                  title: const Text('Logout'),
                  content: const Text('Are you sure you want to logout?'),
                  actions: [
                    TextButton(
                        onPressed: () => Navigator.of(context).pop(false),
                        child: const Text('Cancel')),
                    TextButton(
                        onPressed: () => Navigator.of(context).pop(true),
                        child: const Text('Logout',
                            style: TextStyle(color: Colors.red))),
                  ],
                ),
              );
              if (confirmed == true && context.mounted) {
                await provider.logout();
                if (context.mounted) {
                  Navigator.of(context).pushReplacementNamed('/pharmacy/login');
                }
              }
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome card
            _WelcomeCard(pharmacy: pharmacy),
            const SizedBox(height: 20),

            // Quick stats row
            const Row(
              children: [
                Expanded(
                  child: _StatCard(
                    icon: Icons.receipt_long_outlined,
                    label: 'Prescriptions',
                    value: '0',
                    color: Color(0xFF3B82F6),
                  ),
                ),
                SizedBox(width: 12),
                Expanded(
                  child: _StatCard(
                    icon: Icons.pending_actions_outlined,
                    label: 'Pending',
                    value: '0',
                    color: Color(0xFFF59E0B),
                  ),
                ),
                SizedBox(width: 12),
                Expanded(
                  child: _StatCard(
                    icon: Icons.check_circle_outline,
                    label: 'Fulfilled',
                    value: '0',
                    color: Color(0xFF10B981),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Quick actions
            const Text(
              'Quick Actions',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1F2937),
              ),
            ),
            const SizedBox(height: 12),
            GridView.count(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              childAspectRatio: 1.4,
              children: const [
                _ActionCard(
                  icon: Icons.assignment_outlined,
                  label: 'View Prescriptions',
                  color: Color(0xFF3B82F6),
                ),
                _ActionCard(
                  icon: Icons.inventory_2_outlined,
                  label: 'Manage Inventory',
                  color: Color(0xFF8B5CF6),
                ),
                _ActionCard(
                  icon: Icons.people_outline,
                  label: 'Customers',
                  color: Color(0xFF0D5C3E),
                ),
                _ActionCard(
                  icon: Icons.bar_chart_outlined,
                  label: 'Reports',
                  color: Color(0xFFF59E0B),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Pharmacy info
            if (pharmacy != null) _PharmacyInfoCard(pharmacy: pharmacy),
          ],
        ),
      ),
    );
  }
}

// ── Welcome card ──────────────────────────────────────────────────────────────

class _WelcomeCard extends StatelessWidget {
  final dynamic pharmacy;
  const _WelcomeCard({required this.pharmacy});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0D5C3E), Color(0xFF1A7A57)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          const CircleAvatar(
            radius: 28,
            backgroundColor: Colors.white24,
            child: Icon(Icons.local_pharmacy, color: Colors.white, size: 30),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  pharmacy?.pharmacyName ?? 'Welcome',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  pharmacy != null
                      ? '${pharmacy.city}, ${pharmacy.district}'
                      : '',
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Text(
                    'Approved',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Stat card ─────────────────────────────────────────────────────────────────

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(10),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
          Text(
            label,
            style: const TextStyle(fontSize: 11, color: Colors.grey),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

// ── Action card ───────────────────────────────────────────────────────────────

class _ActionCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _ActionCard({
    required this.icon,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {}, // placeholder — wire up feature screens when ready
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(10),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 8),
            Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Color(0xFF374151),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Pharmacy info card ────────────────────────────────────────────────────────

class _PharmacyInfoCard extends StatelessWidget {
  final dynamic pharmacy;
  const _PharmacyInfoCard({required this.pharmacy});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(10),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Pharmacy Information',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: Color(0xFF0D5C3E),
            ),
          ),
          const Divider(height: 16),
          _infoRow(Icons.person_outline, 'Owner', pharmacy.ownerName),
          _infoRow(Icons.email_outlined, 'Email', pharmacy.email),
          _infoRow(
              Icons.location_on_outlined,
              'Location',
              '${pharmacy.city}, ${pharmacy.district}, ${pharmacy.province}'),
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(
          children: [
            Icon(icon, size: 16, color: const Color(0xFF6B7280)),
            const SizedBox(width: 8),
            Text(
              '$label: ',
              style: const TextStyle(
                  fontSize: 13,
                  color: Color(0xFF6B7280),
                  fontWeight: FontWeight.w500),
            ),
            Expanded(
              child: Text(
                value,
                style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF1F2937),
                    fontWeight: FontWeight.w600),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      );
}
