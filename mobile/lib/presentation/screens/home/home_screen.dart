import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../patient/doctor_search_screen.dart';
import '../../../features/emergency/screens/emergency_type_screen.dart';

class HomeScreen extends StatefulWidget {
  final VoidCallback? onGoToProfile;
  const HomeScreen({super.key, this.onGoToProfile});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final TextEditingController _searchController = TextEditingController();

  // ── Design tokens ─────────────────────────────────────────────────────────────
  static const Color _bg       = Color(0xFFF0F4F8);
  static const Color _green    = Color(0xFF2E7D32);
  static const Color _cardBg   = Colors.white;
  static const Color _border   = Color(0xFFE8EDF2);
  static const Color _text     = Color(0xFF1C2B2C);
  static const Color _subText  = Color(0xFF607D8B);

  final List<Map<String, String>> _tips = [
    {'title': 'Triphala Detox',        'desc': 'Start your day with warm Triphala water to cleanse the digestive system naturally.'},
    {'title': 'Morning Pranayama',     'desc': 'Practice 10 minutes of Nadi Shodhana breathing to balance your doshas.'},
    {'title': 'Ashwagandha Boost',     'desc': 'Add Ashwagandha to warm milk before bed to reduce stress and improve sleep.'},
    {'title': 'Ginger Immunity',       'desc': 'Fresh ginger tea with honey and tulsi strengthens immunity naturally.'},
    {'title': 'Abhyanga Self-Massage', 'desc': 'Daily warm sesame oil massage calms Vata and deeply nourishes the skin.'},
  ];

  final List<Color> _tipAccents = [
    const Color(0xFF2E7D32),
    const Color(0xFF1565C0),
    const Color(0xFF6A1B9A),
    const Color(0xFFE65100),
    const Color(0xFF00838F),
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(),
              const SizedBox(height: 20),
              _buildSearchBar(),
              const SizedBox(height: 24),
              _buildServicesSection(),
              const SizedBox(height: 28),
              _buildTipsSection(),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  // ── Header ────────────────────────────────────────────────────────────────────

  Widget _buildHeader() {
    final auth      = Provider.of<AuthProvider>(context);
    final isGuest   = auth.isGuest;
    final user      = auth.user ?? {};
    final firstName = user['firstName'] ?? user['name']?.toString().split(' ').first ?? 'User';
    final lastName  = user['lastName']  ?? '';
    final imagePath = auth.profileImagePath;
    final initials  = '${firstName.isNotEmpty ? firstName[0] : ''}${lastName.isNotEmpty ? lastName[0] : ''}'.toUpperCase();

    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF1B5E20), Color(0xFF2E7D32), Color(0xFF388E3C)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(32),
          bottomRight: Radius.circular(32),
        ),
      ),
      child: Stack(
        children: [
          // Decorative circles
          Positioned(right: -30, top: -30,
            child: Container(width: 160, height: 160,
              decoration: BoxDecoration(shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.06)))),
          Positioned(right: 40, bottom: -40,
            child: Container(width: 110, height: 110,
              decoration: BoxDecoration(shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.05)))),
          Positioned(left: -20, bottom: 10,
            child: Container(width: 80, height: 80,
              decoration: BoxDecoration(shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.04)))),
          // Content
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top bar
                Row(
                  children: [
                    // Logo pill
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.16),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.25)),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.local_florist_rounded, color: Colors.white, size: 16),
                          SizedBox(width: 6),
                          Text('Lakwedha',
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800,
                              fontSize: 16, letterSpacing: 0.4)),
                        ],
                      ),
                    ),
                    const Spacer(),
                    GestureDetector(
                      onTap: () => Navigator.pushNamed(context, '/notifications'),
                      child: _topBarBtn(Icons.notifications_outlined, badge: true),
                    ),
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: widget.onGoToProfile,
                      child: _topBarBtn(Icons.person_outline_rounded),
                    ),
                  ],
                ),
                if (!isGuest) ...[
                  const SizedBox(height: 24),
                  // Greeting row (authenticated users only)
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(_greeting(),
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.80),
                                fontSize: 13.5, fontWeight: FontWeight.w500,
                              )),
                            const SizedBox(height: 2),
                            Text('Welcome, $firstName',
                              style: const TextStyle(color: Colors.white, fontSize: 24,
                                fontWeight: FontWeight.w800, height: 1.1)),
                            const SizedBox(height: 6),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      // Avatar
                      GestureDetector(
                        onTap: widget.onGoToProfile,
                        child: Container(
                          width: 58, height: 58,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white.withValues(alpha: 0.4), width: 2),
                          ),
                          child: ClipOval(
                            child: imagePath != null && imagePath.isNotEmpty
                              ? Image.file(File(imagePath), fit: BoxFit.cover)
                              : Container(
                                  color: Colors.white.withValues(alpha: 0.20),
                                  child: Center(
                                    child: initials.isNotEmpty
                                      ? Text(initials, style: const TextStyle(
                                          color: Colors.white, fontSize: 22,
                                          fontWeight: FontWeight.w800))
                                      : const Icon(Icons.person_rounded,
                                          color: Colors.white, size: 30),
                                  ),
                                ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _topBarBtn(IconData icon, {bool badge = false}) {
    return Stack(
      children: [
        Container(
          padding: const EdgeInsets.all(9),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
          ),
          child: Icon(icon, color: Colors.white, size: 20),
        ),
        if (badge)
          Positioned(right: 5, top: 5,
            child: Container(
              width: 7, height: 7,
              decoration: const BoxDecoration(
                color: Color(0xFFFF5252), shape: BoxShape.circle),
            )),
      ],
    );
  }

  // ── Search Bar ────────────────────────────────────────────────────────────────

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        decoration: BoxDecoration(
          color: _cardBg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: _border),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 14, offset: const Offset(0, 4))],
        ),
        child: TextField(
          controller: _searchController,
          onSubmitted: (v) {
            if (v.trim().isEmpty) return;
            Navigator.push(context, MaterialPageRoute(builder: (_) => const DoctorSearchScreen()));
          },
          style: const TextStyle(fontSize: 14, color: _text),
          decoration: InputDecoration(
            hintText: 'Search doctors, medicines…',
            hintStyle: const TextStyle(color: _subText, fontSize: 13.5),
            prefixIcon: const Padding(
              padding: EdgeInsets.only(left: 4),
              child: Icon(Icons.search_rounded, color: _green, size: 22),
            ),
            suffixIcon: Container(
              margin: const EdgeInsets.all(7),
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(
                color: _green,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.tune_rounded, color: Colors.white, size: 15),
            ),
            border: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
          ),
        ),
      ),
    );
  }

  // ── Services Section ──────────────────────────────────────────────────────────

  Widget _buildServicesSection() {
    final isGuest = Provider.of<AuthProvider>(context, listen: false).isGuest;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 20),
          child: Text('Our Services',
            style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: _text)),
        ),
        const SizedBox(height: 4),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 20),
          child: Text('Access Lakwedha healthcare features',
            style: TextStyle(fontSize: 13, color: _subText)),
        ),
        const SizedBox(height: 16),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            children: [
              _serviceCard(
                icon: Icons.medical_services_rounded,
                iconColor: _green,
                gradient: const LinearGradient(
                  colors: [Color(0xFF1B5E20), Color(0xFF2E7D32)],
                  begin: Alignment.topLeft, end: Alignment.bottomRight,
                ),
                tag: 'CHANNELING',
                title: 'Doctor Channeling',
                desc: 'Find and book appointments with certified Ayurveda specialists near you.',
                buttonLabel: 'Find a Doctor',
                buttonIcon: Icons.arrow_forward_rounded,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DoctorSearchScreen())),
              ),
              const SizedBox(height: 14),
              _serviceCard(
                icon: Icons.local_pharmacy_rounded,
                iconColor: const Color(0xFF00695C),
                gradient: const LinearGradient(
                  colors: [Color(0xFF004D40), Color(0xFF00695C)],
                  begin: Alignment.topLeft, end: Alignment.bottomRight,
                ),
                tag: 'PHARMACY',
                title: 'Ayurveda Pharmacy',
                desc: 'Order authentic herbal medicines and Ayurveda products delivered to your door.',
                buttonLabel: 'Browse Medicines',
                buttonIcon: Icons.arrow_forward_rounded,
                onTap: () {},
              ),
              if (!isGuest) ...[
                const SizedBox(height: 14),
                _serviceCard(
                  icon: Icons.emergency_rounded,
                  iconColor: const Color(0xFFBF360C),
                  gradient: const LinearGradient(
                    colors: [Color(0xFF870000), Color(0xFFBF360C)],
                    begin: Alignment.topLeft, end: Alignment.bottomRight,
                  ),
                  tag: 'EMERGENCY',
                  title: 'Emergency Help',
                  desc: 'Instant access to emergency contacts, ambulance services, and urgent care.',
                  buttonLabel: 'Find Now',
                  buttonIcon: Icons.location_on_rounded,
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const EmergencyTypeScreen()),
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _serviceCard({
    required IconData icon,
    required Color iconColor,
    required Gradient gradient,
    required String tag,
    required String title,
    required String desc,
    required String buttonLabel,
    required IconData buttonIcon,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.10), blurRadius: 18, offset: const Offset(0, 6))],
        ),
        child: Stack(
          children: [
            // Decorative circles
            Positioned(right: -24, top: -24,
              child: Container(width: 100, height: 100,
                decoration: BoxDecoration(shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.07)))),
            Positioned(right: 16, bottom: -20,
              child: Container(width: 60, height: 60,
                decoration: BoxDecoration(shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.05)))),
            // Content
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 46, height: 46,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.18),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Icon(icon, color: Colors.white, size: 24),
                      ),
                      const SizedBox(width: 12),
                      Flexible(
                        child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.18),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(tag,
                              style: const TextStyle(color: Colors.white, fontSize: 9.5,
                                fontWeight: FontWeight.w800, letterSpacing: 1.2)),
                          ),
                          const SizedBox(height: 3),
                          Text(title,
                            style: const TextStyle(color: Colors.white, fontSize: 17,
                              fontWeight: FontWeight.w800, height: 1.1)),
                        ],
                      )),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(desc,
                    style: TextStyle(color: Colors.white.withValues(alpha: 0.82),
                      fontSize: 13, height: 1.5)),
                  const SizedBox(height: 16),
                  // Button
                  Row(
                    children: [
                      GestureDetector(
                        onTap: onTap,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.10), blurRadius: 8, offset: const Offset(0, 2))],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(buttonLabel,
                                style: TextStyle(color: iconColor, fontWeight: FontWeight.w700, fontSize: 13)),
                              const SizedBox(width: 6),
                              Icon(buttonIcon, color: iconColor, size: 15),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Health Tips ───────────────────────────────────────────────────────────────

  Widget _buildTipsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Ayurveda Health Tips',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: _text)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                decoration: BoxDecoration(
                  color: const Color(0xFFE8F5E9),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text('View All',
                  style: TextStyle(color: _green, fontSize: 12, fontWeight: FontWeight.w700)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 4),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 20),
          child: Text('Daily wellness guidance from Ayurveda',
            style: TextStyle(fontSize: 13, color: _subText)),
        ),
        const SizedBox(height: 14),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 20),
          itemCount: _tips.length,
          separatorBuilder: (_, __) => const SizedBox(height: 10),
          itemBuilder: (_, i) => _tipCard(i),
        ),
      ],
    );
  }

  Widget _tipCard(int i) {
    final tip = _tips[i];
    final accent = _tipAccents[i % _tipAccents.length];
    return Container(
      decoration: BoxDecoration(
        color: _cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _border),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Row(
        children: [
          // Left accent bar
          Container(
            width: 4,
            height: 80,
            decoration: BoxDecoration(
              color: accent,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                bottomLeft: Radius.circular(16),
              ),
            ),
          ),
          const SizedBox(width: 14),
          // Icon
          Container(
            width: 42, height: 42,
            decoration: BoxDecoration(
              color: accent.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(Icons.spa_rounded, color: accent, size: 22),
          ),
          const SizedBox(width: 12),
          // Text
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(tip['title']!,
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: _text)),
                  const SizedBox(height: 3),
                  Text(tip['desc']!,
                    style: const TextStyle(fontSize: 12.5, color: _subText, height: 1.4),
                    maxLines: 2, overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(right: 14),
            child: Icon(Icons.chevron_right_rounded, color: Colors.grey[400], size: 20),
          ),
        ],
      ),
    );
  }
}
