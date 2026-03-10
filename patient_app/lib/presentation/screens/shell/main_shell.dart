import 'package:flutter/material.dart';
import '../home/home_screen.dart';
import '../patient/doctor_search_screen.dart';
import '../patient/appointment_history_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;

  static const Color _primary = Color(0xFF2E7D32);

  static final List<Widget> _screens = [
    const HomeScreen(),
    const DoctorSearchScreen(),
    const _PlaceholderScreen(icon: '🌿', label: 'Pharmacy',     desc: 'Coming Soon'),
    const AppointmentHistoryScreen(),
    const _PlaceholderScreen(icon: '👤', label: 'Profile',      desc: 'Coming Soon'),
  ];

  static const _navItems = [
    (Icons.home_rounded,            Icons.home_outlined,             'Home'),
    (Icons.medical_services_rounded, Icons.medical_services_outlined, 'Doctors'),
    (Icons.local_pharmacy_rounded,  Icons.local_pharmacy_outlined,   'Pharmacy'),
    (Icons.calendar_month_rounded,  Icons.calendar_month_outlined,   'Schedule'),
    (Icons.person_rounded,          Icons.person_outline_rounded,    'Profile'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _screens),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: const Border(top: BorderSide(color: Color(0xFFE8EDF2))),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 12, offset: const Offset(0, -3))],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                for (int i = 0; i < _navItems.length; i++)
                  _navItem(i, _navItems[i].$1, _navItems[i].$2, _navItems[i].$3),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _navItem(int index, IconData activeIcon, IconData inactiveIcon, String label) {
    final bool selected = _currentIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _currentIndex = index),
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFFE8F5E9) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              selected ? activeIcon : inactiveIcon,
              color: selected ? _primary : Colors.grey[500],
              size: 21,
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                color: selected ? _primary : Colors.grey[500],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PlaceholderScreen extends StatelessWidget {
  final String icon;
  final String label;
  final String desc;

  const _PlaceholderScreen({required this.icon, required this.label, required this.desc});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF0F4F8),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(icon, style: const TextStyle(fontSize: 56)),
            const SizedBox(height: 16),
            Text(label, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFF2E7D32))),
            const SizedBox(height: 8),
            Text(desc, style: const TextStyle(fontSize: 14, color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}
