import 'package:flutter/material.dart';
import '../../../data/models/doctor_availability_model.dart';
import '../../../data/models/doctor_model.dart';
import 'appointment_registration_screen.dart';

const Color _primary = Color(0xFF2E7D32);
const Color _bg = Color(0xFFF4FAF4);

class DoctorAvailabilityScreen extends StatelessWidget {
  final DoctorAvailabilityResult availability;

  const DoctorAvailabilityScreen({super.key, required this.availability});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        title: const Text(
          'Doctor Availability',
          style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
        ),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1A1A2E),
        elevation: 0,
        centerTitle: true,
        surfaceTintColor: Colors.transparent,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
        children: [
          _doctorSummaryCard(),
          const SizedBox(height: 16),
          if (availability.hospitals.isEmpty)
            _noAvailability()
          else ...[
            Padding(
              padding: const EdgeInsets.only(left: 4, bottom: 12),
              child: Row(
                children: [
                  const Icon(Icons.local_hospital_outlined,
                      size: 14, color: _primary),
                  const SizedBox(width: 6),
                  Text(
                    'Available at ${availability.hospitals.length} hospital${availability.hospitals.length > 1 ? 's' : ''}',
                    style: const TextStyle(
                      fontSize: 13,
                      color: _primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            ...availability.hospitals
                .map((h) => _hospitalCard(context, h)),
          ],
        ],
      ),
    );
  }

  Widget _doctorSummaryCard() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.07),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Avatar circle
          Container(
            width: 64,
            height: 64,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFFE8F5E9), Color(0xFFC8E6C9)],
              ),
            ),
            child: Center(
              child: Text(
                availability.doctorName.isNotEmpty
                    ? availability.doctorName[0].toUpperCase()
                    : 'D',
                style: const TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                  color: _primary,
                ),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  availability.doctorName,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1A1A2E),
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  availability.specialization,
                  style: const TextStyle(
                    fontSize: 13,
                    color: _primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (availability.qualification != null &&
                    availability.qualification!.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    availability.qualification!,
                    style: TextStyle(fontSize: 11, color: Colors.grey[500]),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                if (availability.isVerified) ...[
                  const SizedBox(height: 6),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F5E9),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.verified_rounded,
                            size: 11, color: _primary),
                        SizedBox(width: 3),
                        Text('Verified',
                            style: TextStyle(
                                fontSize: 10,
                                color: _primary,
                                fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _hospitalCard(BuildContext context, HospitalAvailability hospital) {
    final futureDates =
        hospital.dates.where((d) => d.date.isNotEmpty).toList();

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.07),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Gradient header
          Container(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [_primary, Color(0xFF43A047)],
              ),
              borderRadius:
                  BorderRadius.vertical(top: Radius.circular(18)),
            ),
            child: Row(
              children: [
                const Icon(Icons.local_hospital_outlined,
                    size: 18, color: Colors.white),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    hospital.hospitalName,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '${futureDates.length} session${futureDates.length != 1 ? 's' : ''}',
                    style: const TextStyle(
                        fontSize: 11,
                        color: Colors.white,
                        fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),

          // Location
          if (hospital.location.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
              child: Row(
                children: [
                  Icon(Icons.location_on_outlined,
                      size: 13, color: Colors.grey[400]),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      hospital.location,
                      style:
                          TextStyle(fontSize: 11, color: Colors.grey[500]),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),

          const Padding(
            padding: EdgeInsets.fromLTRB(16, 12, 16, 6),
            child: Text(
              'UPCOMING SESSIONS',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w800,
                color: Color(0xFF9E9E9E),
                letterSpacing: 1.2,
              ),
            ),
          ),

          if (futureDates.isEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
              child: Text(
                'No upcoming sessions available.',
                style: TextStyle(fontSize: 13, color: Colors.grey[400]),
              ),
            )
          else
            ...futureDates.map((d) => _dateRow(context, hospital, d)),

          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _dateRow(
      BuildContext context, HospitalAvailability hospital, DateSlotSummary slot) {
    final isFull = slot.status == 'full';
    final isLimited = slot.status == 'limited';

    final statusColor = isFull
        ? const Color(0xFFE53935)
        : isLimited
            ? const Color(0xFFF57C00)
            : const Color(0xFF2E7D32);

    final statusBg = isFull
        ? const Color(0xFFFFEBEE)
        : isLimited
            ? const Color(0xFFFFF3E0)
            : const Color(0xFFE8F5E9);

    final buttonColor = isFull
        ? const Color(0xFFE53935)
        : isLimited
            ? const Color(0xFFF57C00)
            : _primary;

    return Container(
      margin: const EdgeInsets.fromLTRB(12, 0, 12, 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
      decoration: BoxDecoration(
        color: const Color(0xFFF8F8F8),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isFull
              ? Colors.red.withValues(alpha: 0.1)
              : isLimited
                  ? Colors.orange.withValues(alpha: 0.15)
                  : _primary.withValues(alpha: 0.1),
        ),
      ),
      child: Row(
        children: [
          // Date + time
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _fmtDate(slot.date),
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1A1A2E),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  slot.startTime,
                  style: TextStyle(fontSize: 11, color: Colors.grey[500]),
                ),
              ],
            ),
          ),

          // Available appointment number
          if (!isFull) ...[
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: statusBg,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'Appt: ${slot.availableSlots}',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: statusColor,
                ),
              ),
            ),
            const SizedBox(width: 8),
          ],

          // Book button (colour reflects status)
          SizedBox(
            height: 32,
            child: ElevatedButton(
              onPressed:
                  isFull ? null : () => _bookDate(context, hospital, slot),
              style: ElevatedButton.styleFrom(
                backgroundColor: buttonColor,
                foregroundColor: Colors.white,
                disabledBackgroundColor: const Color(0xFFE53935),
                disabledForegroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
                elevation: 0,
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: Text(
                isFull ? 'Full' : 'Book',
                style: const TextStyle(
                    fontSize: 12, fontWeight: FontWeight.w600),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _bookDate(BuildContext context, HospitalAvailability hospital,
      DateSlotSummary slot) {
    final doctor = Doctor(
      id: availability.doctorId,
      name: availability.doctorName,
      specialization: availability.specialization,
      qualification: availability.qualification ?? '',
      experience: 0,
      rating: 0,
      reviewCount: 0,
      profileImage: null,
      clinicName: hospital.hospitalName,
      clinicAddress: hospital.location,
      consultationFee: 0,
      isVerified: availability.isVerified,
    );

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => AppointmentRegistrationScreen(
          doctor: doctor,
          hospital: hospital,
          slot: slot,
        ),
      ),
    );
  }

  Widget _noAvailability() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.grey[100],
                shape: BoxShape.circle,
              ),
              child:
                  Icon(Icons.event_busy_rounded, size: 40, color: Colors.grey[400]),
            ),
            const SizedBox(height: 16),
            Text(
              'No Upcoming Availability',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.grey[700],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'This doctor has no sessions\nscheduled for the next 30 days.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: Colors.grey[500], height: 1.5),
            ),
          ],
        ),
      ),
    );
  }

  static String _fmtDate(String dateStr) {
    final parts = dateStr.split('-');
    if (parts.length != 3) return dateStr;
    try {
      final d = DateTime(
          int.parse(parts[0]), int.parse(parts[1]), int.parse(parts[2]));
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return '${days[d.weekday - 1]}, ${months[d.month - 1]} ${d.day.toString().padLeft(2, '0')}';
    } catch (_) {
      return dateStr;
    }
  }
}
