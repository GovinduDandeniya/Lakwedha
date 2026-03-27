import 'dart:io';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../providers/auth_provider.dart';
import '../../providers/appointment_provider.dart';
import '../../../core/utils/date_formatter.dart';
import '../../../data/datasources/remote/api_service.dart';
import '../../../data/models/appointment_model.dart';
import '../../../data/models/doctor_model.dart';
import '../../../src/screens/pharmacy_finder_screen.dart';
import '../../../src/screens/pharmacy_order_status_screen.dart';
import '../patient/doctor_search_screen.dart';
import 'edit_profile_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final ApiService _apiService = ApiService();

  // ── Design tokens ──────────────────────────────────────────────────────────
  static const Color _green     = Color(0xFF2E7D32);
  static const Color _lightGreen= Color(0xFFE8F5E9);
  static const Color _bg        = Color(0xFFF0F4F8);
  static const Color _cardBg    = Colors.white;
  static const Color _text      = Color(0xFF1C2B2C);
  static const Color _subText   = Color(0xFF607D8B);
  static const Color _border    = Color(0xFFE8EDF2);

  late Future<List<Map<String, dynamic>>> _pharmacyOrdersFuture;

  @override
  void initState() {
    super.initState();
    _pharmacyOrdersFuture = _fetchPharmacyOrders();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AppointmentProvider>(context, listen: false).loadAppointments();
    });
  }

  Future<List<Map<String, dynamic>>> _fetchPharmacyOrders() async {
    try {
      return await _apiService.getMyPharmacyRequests();
    } catch (_) {
      return [];
    }
  }

  void _refreshPharmacyOrders() {
    setState(() {
      _pharmacyOrdersFuture = _fetchPharmacyOrders();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user ?? {};

    final String firstName  = user['firstName']  ?? user['name']?.toString().split(' ').first ?? 'User';
    final String lastName   = user['lastName']   ?? ((user['name']?.toString().split(' ').length ?? 0) > 1
        ? user['name'].toString().split(' ').last : '');
    final String fullName   = '$firstName $lastName'.trim();
    final String email      = user['email']      ?? '';
    final String nic        = user['nic_number']  ?? user['nic'] ?? '—';
    final String birthday   = user['birthday']   ?? user['dateOfBirth'] ?? '';
    final String age        = _calculateAge(birthday);
    final String initials   = '${firstName.isNotEmpty ? firstName[0] : ''}${lastName.isNotEmpty ? lastName[0] : ''}'.toUpperCase();

    if (auth.isGuest) {
      return _buildGuestView(context);
    }

    return Scaffold(
      backgroundColor: _bg,
      body: Consumer<AppointmentProvider>(
        builder: (context, apptProvider, _) {
          // Derive "My Doctors" from all appointments (unique by doctorId)
          final allAppointments = [
            ...apptProvider.upcomingAppointments,
            ...apptProvider.pastAppointments,
          ];
          final Map<String, Doctor> myDoctorsMap = {};
          for (final appt in allAppointments) {
            if (appt.doctorDetails != null) {
              myDoctorsMap.putIfAbsent(appt.doctorId, () => appt.doctorDetails!);
            }
          }
          final myDoctors = myDoctorsMap.values.toList();

          // Recent appointments (latest 3)
          final recentAppts = [...apptProvider.upcomingAppointments, ...apptProvider.pastAppointments]
            ..sort((a, b) => b.slotTime.compareTo(a.slotTime));
          final displayAppts = recentAppts.take(3).toList();

          return CustomScrollView(
            slivers: [
              // ── Header ──────────────────────────────────────────────────────
              SliverToBoxAdapter(child: _buildHeader(context, auth, fullName, email, initials, nic, age, birthday, auth.profileImagePath)),

              // ── Quick actions ────────────────────────────────────────────────
              SliverToBoxAdapter(child: _buildQuickActions(context, auth)),

              // ── My Doctors ───────────────────────────────────────────────────
              SliverToBoxAdapter(child: _buildSectionTitle('My Doctors', Icons.favorite_rounded)),
              if (myDoctors.isEmpty)
                SliverToBoxAdapter(child: _buildEmptyState(
                  icon: Icons.people_outline_rounded,
                  message: 'No doctors yet.\nChannel a doctor to see them here.',
                ))
              else
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (_, i) => _buildDoctorCard(context, myDoctors[i]),
                    childCount: myDoctors.length,
                  ),
                ),

              // ── My Orders ───────────────────────────────────────────────────
              SliverToBoxAdapter(child: _buildSectionTitle('My Orders', Icons.shopping_bag_rounded)),
              SliverToBoxAdapter(child: _buildOrdersSection()),

              // ── Appointment History ──────────────────────────────────────────
              SliverToBoxAdapter(child: _buildSectionTitle('Appointment History', Icons.history_rounded)),
              if (apptProvider.isLoading)
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.all(32),
                    child: Center(child: CircularProgressIndicator(color: _green)),
                  ),
                )
              else if (displayAppts.isEmpty)
                SliverToBoxAdapter(child: _buildEmptyState(
                  icon: Icons.calendar_today_outlined,
                  message: 'No appointments yet.\nBook your first consultation.',
                ))
              else
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (_, i) => _buildAppointmentCard(displayAppts[i]),
                    childCount: displayAppts.length,
                  ),
                ),

              const SliverToBoxAdapter(child: SizedBox(height: 32)),
            ],
          );
        },
      ),
    );
  }

  // ── Guest view ────────────────────────────────────────────────────────────
  Widget _buildGuestView(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF1B5E20), Color(0xFF2E7D32), Color(0xFF388E3C)],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              const SizedBox(height: 48),
              Container(
                width: 90, height: 90,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.15),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.35), width: 2),
                ),
                child: const Icon(Icons.person_outline_rounded, color: Colors.white, size: 48),
              ),
              const SizedBox(height: 20),
              Text('You\'re browsing as a Guest',
                style: GoogleFonts.poppins(
                  color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800)),
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: Text(
                  'Create an account to access your profile, appointments, and more.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.poppins(
                    color: Colors.white.withValues(alpha: 0.78),
                    fontSize: 13.5, height: 1.5),
                ),
              ),
              const SizedBox(height: 36),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: GestureDetector(
                  onTap: () => Navigator.pushReplacementNamed(context, '/sign-up'),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [BoxShadow(
                        color: Colors.black.withValues(alpha: 0.15),
                        blurRadius: 16, offset: const Offset(0, 6))],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.person_add_rounded, color: Color(0xFF2E7D32), size: 20),
                        const SizedBox(width: 10),
                        Text('Create an Account',
                          style: GoogleFonts.poppins(
                            color: const Color(0xFF2E7D32),
                            fontSize: 15, fontWeight: FontWeight.w800)),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: GestureDetector(
                  onTap: () => Navigator.pushReplacementNamed(context, '/sign-in'),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.40)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.login_rounded, color: Colors.white, size: 20),
                        const SizedBox(width: 10),
                        Text('Sign In',
                          style: GoogleFonts.poppins(
                            color: Colors.white,
                            fontSize: 15, fontWeight: FontWeight.w700)),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Profile header card ───────────────────────────────────────────────────
  Widget _buildHeader(BuildContext context, AuthProvider auth, String fullName,
      String email, String initials, String nic, String age, String birthday,
      String? imagePath) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1B5E20), Color(0xFF2E7D32), Color(0xFF388E3C)],
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Stack(
          children: [
            // Decorative circles
            Positioned(top: -30, right: -30,
              child: Container(width: 120, height: 120,
                decoration: BoxDecoration(shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.05)))),
            Positioned(bottom: -20, left: -20,
              child: Container(width: 90, height: 90,
                decoration: BoxDecoration(shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.04)))),

            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
              child: Column(
                children: [
                  // Top bar
                  Row(
                    children: [
                      Text('My Profile',
                        style: GoogleFonts.poppins(
                          color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
                      const Spacer(),
                      GestureDetector(
                        onTap: () => Navigator.push(context, MaterialPageRoute(
                          builder: (_) => const EditProfileScreen())),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.30)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.edit_rounded, size: 13, color: Colors.white),
                              const SizedBox(width: 5),
                              Text('Edit', style: GoogleFonts.poppins(
                                color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // Avatar + name
                  Row(
                    children: [
                      Container(
                        width: 72, height: 72,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white.withValues(alpha: 0.40), width: 2.5),
                          boxShadow: [BoxShadow(
                            color: Colors.black.withValues(alpha: 0.15),
                            blurRadius: 16, offset: const Offset(0, 4))],
                        ),
                        child: ClipOval(
                          child: imagePath != null && imagePath.isNotEmpty
                            ? (kIsWeb
                                ? Image.network(imagePath, fit: BoxFit.cover,
                                    width: 72, height: 72)
                                : Image.file(File(imagePath), fit: BoxFit.cover,
                                    width: 72, height: 72))
                            : Container(
                                color: Colors.white.withValues(alpha: 0.18),
                                child: Center(
                                  child: Text(initials.isNotEmpty ? initials : '👤',
                                    style: GoogleFonts.poppins(
                                      color: Colors.white, fontSize: 26,
                                      fontWeight: FontWeight.w800)),
                                ),
                              ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(fullName,
                              style: GoogleFonts.poppins(
                                color: Colors.white, fontSize: 20,
                                fontWeight: FontWeight.w800, height: 1.2)),
                            const SizedBox(height: 3),
                            Text(email,
                              style: GoogleFonts.poppins(
                                color: Colors.white.withValues(alpha: 0.78),
                                fontSize: 12.5, fontWeight: FontWeight.w400)),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // Info chips row
                  Row(
                    children: [
                      _infoChip(Icons.badge_outlined, 'NIC / ID', nic),
                      const SizedBox(width: 10),
                      _infoChip(Icons.cake_outlined, 'Age', '$age yrs'),
                      if (birthday.isNotEmpty) ...[
                        const SizedBox(width: 10),
                        _infoChip(Icons.calendar_today_outlined, 'DOB',
                          _formatBirthday(birthday)),
                      ],
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

  Widget _infoChip(IconData icon, String label, String value) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.white.withValues(alpha: 0.20)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Icon(icon, size: 11, color: Colors.white.withValues(alpha: 0.65)),
              const SizedBox(width: 4),
              Text(label, style: GoogleFonts.poppins(
                color: Colors.white.withValues(alpha: 0.65),
                fontSize: 9.5, fontWeight: FontWeight.w500, letterSpacing: 0.3)),
            ]),
            const SizedBox(height: 2),
            Text(value, style: GoogleFonts.poppins(
              color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700),
              overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }

  // ── Quick actions ─────────────────────────────────────────────────────────
  Widget _buildQuickActions(BuildContext context, AuthProvider auth) {
    final actions = [
      _QA(Icons.calendar_month_rounded, 'Appointments', const Color(0xFF1565C0), () {}),
      _QA(Icons.favorite_rounded,       'My Doctors',   _green,                  () {}),
      _QA(Icons.shopping_bag_rounded,   'My Orders',    const Color(0xFF00796B), () {
        Navigator.push(context, MaterialPageRoute(
          builder: (_) => const PharmacyOrderStatusScreen(),
        )).then((_) => _refreshPharmacyOrders());
      }),
      _QA(Icons.edit_rounded,   'Edit Profile', const Color(0xFF6A1B9A), () {
        Navigator.push(context, MaterialPageRoute(
          builder: (_) => const EditProfileScreen()));
      }),
      _QA(Icons.logout_rounded, 'Logout', const Color(0xFFC62828), () {
        _showLogoutDialog(context, auth);
      }),
    ];

    // Split into rows of 3 + 2
    final row1 = actions.sublist(0, 3);
    final row2 = actions.sublist(3);

    Widget buildRow(List<_QA> items) => Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: items.map((a) => _quickAction(a.icon, a.label, a.color, a.onTap)).toList(),
    );

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
      decoration: BoxDecoration(
        color: _cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _border),
        boxShadow: [BoxShadow(
          color: Colors.black.withValues(alpha: 0.04),
          blurRadius: 12, offset: const Offset(0, 3))],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          buildRow(row1),
          const SizedBox(height: 16),
          buildRow(row2),
        ],
      ),
    );
  }

  Widget _quickAction(IconData icon, String label, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 80,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 52, height: 52,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.10),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: color.withValues(alpha: 0.20)),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 6),
            Text(label, style: GoogleFonts.poppins(
              fontSize: 10, fontWeight: FontWeight.w600, color: _subText),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }

  // ── Section title ─────────────────────────────────────────────────────────
  Widget _buildSectionTitle(String title, IconData icon) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 10),
      child: Row(
        children: [
          Container(
            width: 32, height: 32,
            decoration: BoxDecoration(
              color: _lightGreen,
              borderRadius: BorderRadius.circular(9),
            ),
            child: Icon(icon, color: _green, size: 17),
          ),
          const SizedBox(width: 10),
          Text(title, style: GoogleFonts.poppins(
            color: _text, fontSize: 16, fontWeight: FontWeight.w800)),
        ],
      ),
    );
  }

  // ── My Orders section ────────────────────────────────────────────────────
  Widget _buildOrdersSection() {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _pharmacyOrdersFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Container(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            padding: const EdgeInsets.symmetric(vertical: 28),
            decoration: BoxDecoration(
              color: _cardBg,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: _border),
            ),
            child: const Center(
              child: CircularProgressIndicator(color: _green),
            ),
          );
        }

        final orders = snapshot.data ?? <Map<String, dynamic>>[];
        // "Pending" = waiting for pharmacy response OR price sent but unpaid
        final pendingOrders = orders
            .where((o) {
              final s = o['status'] as String? ?? 'pending';
              return s == 'pending' || s == 'price_sent';
            })
            .toList();

        if (orders.isEmpty) {
          return _buildEmptyState(
            icon: Icons.shopping_bag_outlined,
            message: 'No orders yet.\nBrowse our Ayurveda pharmacy.',
            actionLabel: 'Browse Medicine',
            onActionTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const PharmacyFinderScreen()),
              );
            },
          );
        }

        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: _cardBg,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: _border),
            boxShadow: [BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 10, offset: const Offset(0, 2))],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      pendingOrders.isNotEmpty
                          ? '${pendingOrders.length} order(s) need attention'
                          : 'No pending orders',
                      style: GoogleFonts.poppins(
                        color: _text,
                        fontSize: 13.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: _refreshPharmacyOrders,
                    icon: const Icon(Icons.refresh_rounded, size: 20),
                    color: _subText,
                    tooltip: 'Refresh orders',
                  ),
                ],
              ),
              if (pendingOrders.isNotEmpty) ...[
                const SizedBox(height: 8),
                for (final order in pendingOrders.take(3))
                  GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const PharmacyOrderStatusScreen()),
                      ).then((_) => _refreshPharmacyOrders());
                    },
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        children: [
                          Icon(
                            (order['status'] as String?) == 'price_sent'
                                ? Icons.monetization_on_rounded
                                : Icons.hourglass_top_rounded,
                            size: 16,
                            color: (order['status'] as String?) == 'price_sent'
                                ? const Color(0xFF1565C0)
                                : const Color(0xFFE65100),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              ((order['pharmacy'] as Map?)?['pharmacyName'] ?? 'Pharmacy').toString(),
                              style: GoogleFonts.poppins(
                                color: _subText,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Text(
                            (order['status'] as String?) == 'price_sent'
                                ? 'Pay Now'
                                : 'Pending',
                            style: GoogleFonts.poppins(
                              color: (order['status'] as String?) == 'price_sent'
                                  ? const Color(0xFF1565C0)
                                  : const Color(0xFFE65100),
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Icon(Icons.chevron_right_rounded, size: 16, color: _subText),
                        ],
                      ),
                    ),
                  ),
              ],
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (_) => const PharmacyOrderStatusScreen()),
                    ).then((_) => _refreshPharmacyOrders());
                  },
                  icon: const Icon(Icons.shopping_bag_outlined, size: 18),
                  label: Text(
                    'View All Orders',
                    style: GoogleFonts.poppins(fontWeight: FontWeight.w700),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _green,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 11),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // ── My Doctors card ───────────────────────────────────────────────────────
  Widget _buildDoctorCard(BuildContext context, Doctor doctor) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _cardBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: _border),
        boxShadow: [BoxShadow(
          color: Colors.black.withValues(alpha: 0.04),
          blurRadius: 10, offset: const Offset(0, 2))],
      ),
      child: Row(
        children: [
          // Avatar
          Container(
            width: 52, height: 52,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF2E7D32), Color(0xFF388E3C)]),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(Icons.person_rounded, color: Colors.white, size: 26),
          ),
          const SizedBox(width: 14),
          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(doctor.name, style: GoogleFonts.poppins(
                  color: _text, fontSize: 14.5, fontWeight: FontWeight.w700)),
                const SizedBox(height: 2),
                Text(doctor.specialization, style: GoogleFonts.poppins(
                  color: _green, fontSize: 12, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Row(children: [
                  Icon(Icons.local_hospital_outlined, size: 12, color: _subText),
                  const SizedBox(width: 4),
                  Flexible(child: Text(doctor.clinicName, style: GoogleFonts.poppins(
                    color: _subText, fontSize: 11.5), overflow: TextOverflow.ellipsis)),
                ]),
              ],
            ),
          ),
          const SizedBox(width: 10),
          // Channel again button
          GestureDetector(
            onTap: () {
              Navigator.push(context, MaterialPageRoute(
                builder: (_) => const DoctorSearchScreen()));
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF2E7D32), Color(0xFF388E3C)]),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text('Channel\nAgain', style: GoogleFonts.poppins(
                color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700),
                textAlign: TextAlign.center),
            ),
          ),
        ],
      ),
    );
  }

  // ── Appointment card ──────────────────────────────────────────────────────
  Widget _buildAppointmentCard(Appointment appt) {
    final doctor = appt.doctorDetails;
    final statusColor = _statusColor(appt.status);
    final statusIcon  = _statusIcon(appt.status);

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _cardBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: _border),
        boxShadow: [BoxShadow(
          color: Colors.black.withValues(alpha: 0.04),
          blurRadius: 10, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Doctor avatar
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(
                  color: _lightGreen,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.person_rounded, color: _green, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(doctor?.name ?? 'Doctor', style: GoogleFonts.poppins(
                      color: _text, fontSize: 14, fontWeight: FontWeight.w700)),
                    Text(doctor?.specialization ?? '', style: GoogleFonts.poppins(
                      color: _green, fontSize: 11.5, fontWeight: FontWeight.w600)),
                    if ((doctor?.clinicName ?? '').isNotEmpty)
                      Text(doctor!.clinicName, style: GoogleFonts.poppins(
                        color: _subText, fontSize: 11), overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
              // Status badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.10),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: statusColor.withValues(alpha: 0.40)),
                ),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(statusIcon, size: 11, color: statusColor),
                  const SizedBox(width: 4),
                  Text(appt.status.display, style: GoogleFonts.poppins(
                    color: statusColor, fontSize: 10.5, fontWeight: FontWeight.w700)),
                ]),
              ),
            ],
          ),

          const SizedBox(height: 12),
          Container(height: 1, color: _border),
          const SizedBox(height: 10),

          // Details row
          Wrap(
            spacing: 16,
            runSpacing: 6,
            children: [
              _detailChip(Icons.calendar_today_rounded,
                DateFormatter.formatDate(appt.slotTime)),
              _detailChip(Icons.access_time_rounded,
                DateFormatter.formatTime(appt.slotTime)),
              if (appt.appointmentId.isNotEmpty)
                _detailChip(Icons.confirmation_number_outlined,
                  'No. ${appt.appointmentId}'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _detailChip(IconData icon, String text) {
    return Row(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, size: 13, color: _subText),
      const SizedBox(width: 4),
      Text(text, style: GoogleFonts.poppins(
        color: _subText, fontSize: 11.5, fontWeight: FontWeight.w500)),
    ]);
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  Widget _buildEmptyState({
    required IconData icon,
    required String message,
    String? actionLabel,
    VoidCallback? onActionTap,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      padding: const EdgeInsets.symmetric(vertical: 28),
      decoration: BoxDecoration(
        color: _cardBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: _border),
      ),
      child: Column(
        children: [
          Icon(icon, size: 40, color: Colors.grey[350]),
          const SizedBox(height: 10),
          Text(message, style: GoogleFonts.poppins(
            color: _subText, fontSize: 13, height: 1.5),
            textAlign: TextAlign.center),
          if (actionLabel != null && onActionTap != null) ...[
            const SizedBox(height: 14),
            ElevatedButton.icon(
              onPressed: onActionTap,
              icon: const Icon(Icons.local_pharmacy_rounded, size: 18),
              label: Text(
                actionLabel,
                style: GoogleFonts.poppins(fontWeight: FontWeight.w700),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: _green,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  Color _statusColor(AppointmentStatus s) {
    switch (s) {
      case AppointmentStatus.completed:   return const Color(0xFF2E7D32);
      case AppointmentStatus.confirmed:   return const Color(0xFF1565C0);
      case AppointmentStatus.cancelled:   return const Color(0xFFC62828);
      case AppointmentStatus.pending:     return const Color(0xFFE65100);
      default:                            return Colors.grey;
    }
  }

  IconData _statusIcon(AppointmentStatus s) {
    switch (s) {
      case AppointmentStatus.completed:   return Icons.check_circle_rounded;
      case AppointmentStatus.confirmed:   return Icons.schedule_rounded;
      case AppointmentStatus.cancelled:   return Icons.cancel_rounded;
      case AppointmentStatus.pending:     return Icons.hourglass_top_rounded;
      default:                            return Icons.info_rounded;
    }
  }

  String _calculateAge(String birthday) {
    if (birthday.isEmpty) return '—';
    try {
      final dob = DateTime.parse(birthday);
      final now = DateTime.now();
      int age = now.year - dob.year;
      if (now.month < dob.month || (now.month == dob.month && now.day < dob.day)) {
        age--;
      }
      return age.toString();
    } catch (_) {
      return '—';
    }
  }

  String _formatBirthday(String raw) {
    try {
      final dt = DateTime.parse(raw);
      const months = ['Jan','Feb','Mar','Apr','May','Jun',
                      'Jul','Aug','Sep','Oct','Nov','Dec'];
      return '${dt.day} ${months[dt.month - 1]}';
    } catch (_) {
      return raw;
    }
  }

  // ── Dialogs ───────────────────────────────────────────────────────────────
  void _showLogoutDialog(BuildContext context, AuthProvider auth) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Logout', style: GoogleFonts.poppins(
          fontWeight: FontWeight.w800, color: _text)),
        content: Text('Are you sure you want to logout?',
          style: GoogleFonts.poppins(color: _subText, fontSize: 14)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel', style: GoogleFonts.poppins(
              color: _subText, fontWeight: FontWeight.w600)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              auth.logout();
              Navigator.pushReplacementNamed(context, '/sign-in');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFC62828),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: Text('Logout', style: GoogleFonts.poppins(
              color: Colors.white, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }
}

// ── Simple data holder for quick-action items ────────────────────────────────
class _QA {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _QA(this.icon, this.label, this.color, this.onTap);
}
