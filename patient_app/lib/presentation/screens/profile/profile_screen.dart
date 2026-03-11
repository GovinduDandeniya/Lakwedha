import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../providers/auth_provider.dart';
import '../../providers/appointment_provider.dart';
import '../../../core/utils/date_formatter.dart';
import '../../../data/models/appointment_model.dart';
import '../../../data/models/doctor_model.dart';
import '../patient/doctor_search_screen.dart';
import 'edit_profile_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  // ── Design tokens ──────────────────────────────────────────────────────────
  static const Color _green     = Color(0xFF2E7D32);
  static const Color _lightGreen= Color(0xFFE8F5E9);
  static const Color _bg        = Color(0xFFF0F4F8);
  static const Color _cardBg    = Colors.white;
  static const Color _text      = Color(0xFF1C2B2C);
  static const Color _subText   = Color(0xFF607D8B);
  static const Color _border    = Color(0xFFE8EDF2);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AppointmentProvider>(context, listen: false).loadAppointments();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user ?? {};

    final String firstName  = user['firstName']  ?? user['name']?.toString().split(' ').first ?? 'User';
    final String lastName   = user['lastName']   ?? (user['name']?.toString().split(' ').length ?? 0) > 1
        ? user['name'].toString().split(' ').last : '';
    final String fullName   = '$firstName $lastName'.trim();
    final String email      = user['email']      ?? '';
    final String nic        = user['nic']        ?? user['nicPassport'] ?? user['passport'] ?? '—';
    final String age        = user['age']?.toString() ?? '—';
    final String birthday   = user['birthday']   ?? user['dateOfBirth'] ?? '';
    final String initials   = '${firstName.isNotEmpty ? firstName[0] : ''}${lastName.isNotEmpty ? lastName[0] : ''}'.toUpperCase();

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
                            ? Image.file(File(imagePath), fit: BoxFit.cover,
                                width: 72, height: 72)
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
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _border),
        boxShadow: [BoxShadow(
          color: Colors.black.withValues(alpha: 0.04),
          blurRadius: 12, offset: const Offset(0, 3))],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _quickAction(Icons.calendar_month_rounded, 'Appointments', const Color(0xFF1565C0), () {}),
          _quickAction(Icons.favorite_rounded, 'My Doctors', _green, () {}),
          _quickAction(Icons.edit_rounded, 'Edit Profile', const Color(0xFF6A1B9A), () {
            Navigator.push(context, MaterialPageRoute(
              builder: (_) => const EditProfileScreen()));
          }),
          _quickAction(Icons.logout_rounded, 'Logout', const Color(0xFFC62828), () {
            _showLogoutDialog(context, auth);
          }),
        ],
      ),
    );
  }

  Widget _quickAction(IconData icon, String label, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 48, height: 48,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: color.withValues(alpha: 0.20)),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(height: 6),
          Text(label, style: GoogleFonts.poppins(
            fontSize: 10, fontWeight: FontWeight.w600, color: _subText),
            textAlign: TextAlign.center),
        ],
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
  // TODO (Pharmacy dev): Replace _sampleOrders with real data from pharmacy backend
  static const List<Map<String, dynamic>> _sampleOrders = [
    {
      'orderId':  'ORD-2025-001',
      'items':    'Triphala Churna × 2, Ashwagandha Tablet × 1',
      'date':     '08 Mar 2026',
      'total':    'Rs. 2,450',
      'status':   'Delivered',
    },
    {
      'orderId':  'ORD-2025-002',
      'items':    'Neem Capsule × 1, Ginger Honey Syrup × 2',
      'date':     '10 Mar 2026',
      'total':    'Rs. 1,890',
      'status':   'Processing',
    },
  ];

  Widget _buildOrdersSection() {
    // TODO (Pharmacy dev): Replace with real orders list from backend
    final orders = _sampleOrders;

    if (orders.isEmpty) {
      return _buildEmptyState(
        icon: Icons.shopping_bag_outlined,
        message: 'No orders yet.\nBrowse our Ayurveda pharmacy.',
      );
    }

    return Column(
      children: [
        for (final order in orders) _buildOrderCard(order),
        // View all orders button
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
          child: GestureDetector(
            onTap: () {}, // TODO: navigate to full orders screen
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 13),
              decoration: BoxDecoration(
                color: _cardBg,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: _green.withValues(alpha: 0.35)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.receipt_long_rounded, size: 16, color: _green),
                  const SizedBox(width: 8),
                  Text('View All Orders', style: GoogleFonts.poppins(
                    color: _green, fontSize: 13, fontWeight: FontWeight.w700)),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildOrderCard(Map<String, dynamic> order) {
    final status = order['status'] as String;
    final Color statusColor;
    final IconData statusIcon;
    switch (status) {
      case 'Delivered':
        statusColor = const Color(0xFF2E7D32);
        statusIcon  = Icons.check_circle_rounded;
        break;
      case 'Processing':
        statusColor = const Color(0xFFE65100);
        statusIcon  = Icons.hourglass_top_rounded;
        break;
      case 'Shipped':
        statusColor = const Color(0xFF1565C0);
        statusIcon  = Icons.local_shipping_rounded;
        break;
      case 'Cancelled':
        statusColor = const Color(0xFFC62828);
        statusIcon  = Icons.cancel_rounded;
        break;
      default:
        statusColor = _subText;
        statusIcon  = Icons.info_rounded;
    }

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
          // Top row
          Row(
            children: [
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(
                  color: const Color(0xFFE8F5E9),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.local_pharmacy_rounded,
                  color: _green, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(order['orderId'], style: GoogleFonts.poppins(
                      color: _text, fontSize: 13.5, fontWeight: FontWeight.w700)),
                    Text(order['date'], style: GoogleFonts.poppins(
                      color: _subText, fontSize: 11.5)),
                  ],
                ),
              ),
              // Status badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.10),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: statusColor.withValues(alpha: 0.35)),
                ),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(statusIcon, size: 11, color: statusColor),
                  const SizedBox(width: 4),
                  Text(status, style: GoogleFonts.poppins(
                    color: statusColor, fontSize: 10.5, fontWeight: FontWeight.w700)),
                ]),
              ),
            ],
          ),

          const SizedBox(height: 10),
          Container(height: 1, color: _border),
          const SizedBox(height: 10),

          // Items
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Icon(Icons.inventory_2_outlined, size: 13, color: _subText),
            const SizedBox(width: 6),
            Expanded(child: Text(order['items'], style: GoogleFonts.poppins(
              color: _subText, fontSize: 11.5, height: 1.4))),
          ]),
          const SizedBox(height: 8),

          // Total + action button
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(children: [
                Icon(Icons.payments_outlined, size: 13, color: _subText),
                const SizedBox(width: 5),
                Text(order['total'], style: GoogleFonts.poppins(
                  color: _text, fontSize: 13, fontWeight: FontWeight.w700)),
              ]),
              GestureDetector(
                onTap: () {}, // TODO: navigate to order details / tracking
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF004D40), Color(0xFF00695C)]),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    status == 'Delivered' ? 'Reorder' : 'Track Order',
                    style: GoogleFonts.poppins(
                      color: Colors.white, fontSize: 11.5,
                      fontWeight: FontWeight.w700)),
                ),
              ),
            ],
          ),
        ],
      ),
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
  Widget _buildEmptyState({required IconData icon, required String message}) {
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
