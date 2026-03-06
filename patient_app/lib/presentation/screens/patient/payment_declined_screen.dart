import 'package:flutter/material.dart';
import '../../../data/models/doctor_availability_model.dart';
import '../../../data/models/doctor_model.dart';

const Color _primary = Color(0xFF2E7D32);
const Color _bg = Color(0xFFF4FAF4);
const Color _red = Color(0xFFE53935);

class PaymentDeclinedScreen extends StatelessWidget {
  final Doctor doctor;
  final HospitalAvailability hospital;
  final DateSlotSummary slot;
  final int appointmentNumber;
  final Map<String, dynamic> patient;
  final double totalAmount;

  /// Human-readable reason returned by the payment gateway.
  final String reason;

  const PaymentDeclinedScreen({
    super.key,
    required this.doctor,
    required this.hospital,
    required this.slot,
    required this.appointmentNumber,
    required this.patient,
    required this.totalAmount,
    this.reason = 'Your payment could not be processed.',
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: const Text(
          'Payment Failed',
          style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
        ),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1A1A2E),
        elevation: 0,
        centerTitle: true,
        surfaceTintColor: Colors.transparent,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 32, 16, 40),
        children: [
          // ── Failed icon ─────────────────────────────────────────────────
          _failedHeader(),
          const SizedBox(height: 28),

          // ── Appointment summary ─────────────────────────────────────────
          _appointmentCard(),
          const SizedBox(height: 20),

          // ── Common reasons ───────────────────────────────────────────────
          _reasonsCard(),
          const SizedBox(height: 28),

          // ── Action buttons ───────────────────────────────────────────────
          _actionButtons(context),
        ],
      ),
    );
  }

  // ── Failed header ───────────────────────────────────────────────────────────

  Widget _failedHeader() {
    return Column(
      children: [
        Container(
          width: 88,
          height: 88,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: const Color(0xFFFFEBEE),
            boxShadow: [
              BoxShadow(
                color: _red.withValues(alpha: 0.25),
                blurRadius: 20,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: const Icon(Icons.close_rounded, size: 48, color: _red),
        ),
        const SizedBox(height: 16),
        const Text(
          'Payment Declined',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1A1A2E),
          ),
        ),
        const SizedBox(height: 8),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Text(
            reason,
            textAlign: TextAlign.center,
            style: TextStyle(
                fontSize: 13, color: Colors.grey[600], height: 1.5),
          ),
        ),
      ],
    );
  }

  // ── Appointment card ────────────────────────────────────────────────────────

  Widget _appointmentCard() {
    return Container(
      decoration: _cardDecoration(),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            decoration: BoxDecoration(
              color: const Color(0xFFF5F5F5),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                _avatarCircle(doctor.name, 40),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(doctor.name,
                          style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1A1A2E))),
                      const SizedBox(height: 2),
                      Text(doctor.specialization,
                          style: const TextStyle(
                              fontSize: 12,
                              color: _primary,
                              fontWeight: FontWeight.w500)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEEEEEE),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('$appointmentNumber',
                          style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF757575),
                              height: 1)),
                      const Text('Appt No.',
                          style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF757575))),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
            child: Column(
              children: [
                _infoRow(Icons.local_hospital_outlined, 'Hospital',
                    hospital.hospitalName),
                const SizedBox(height: 8),
                _infoRow(Icons.calendar_today_outlined, 'Date',
                    _fmtDate(slot.date)),
                const SizedBox(height: 8),
                _infoRow(Icons.access_time_rounded, 'Time', slot.startTime),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFEBEE),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Amount',
                          style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: _red)),
                      Text('LKR ${totalAmount.toStringAsFixed(2)}',
                          style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: _red)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Common reasons card ──────────────────────────────────────────────────────

  Widget _reasonsCard() {
    const reasons = [
      (Icons.credit_card_off_outlined, 'Insufficient funds or card limit exceeded'),
      (Icons.block_outlined, 'Card declined by issuing bank'),
      (Icons.wifi_off_rounded, 'Network or connectivity issue'),
      (Icons.lock_outline_rounded, 'Incorrect card details entered'),
      (Icons.schedule_rounded, 'Session timed out during processing'),
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: _cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'POSSIBLE REASONS',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              color: Color(0xFF9E9E9E),
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 12),
          ...reasons.map(
            (r) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(r.$1, size: 16, color: const Color(0xFFE57373)),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(r.$2,
                        style: const TextStyle(
                            fontSize: 13, color: Color(0xFF555555), height: 1.4)),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Action buttons ──────────────────────────────────────────────────────────

  Widget _actionButtons(BuildContext context) {
    return Column(
      children: [
        // Try Again — go back to Payment screen
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton.icon(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.refresh_rounded, size: 20),
            label: const Text(
              'Try Again',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: _red,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
              elevation: 0,
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Change Payment Method — also pops back to PaymentScreen
        SizedBox(
          width: double.infinity,
          height: 52,
          child: OutlinedButton.icon(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.payment_rounded, size: 20),
            label: const Text(
              'Change Payment Method',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
            ),
            style: OutlinedButton.styleFrom(
              foregroundColor: _primary,
              side: const BorderSide(color: _primary, width: 1.5),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Cancel — go all the way back to Home
        SizedBox(
          width: double.infinity,
          height: 52,
          child: TextButton(
            onPressed: () =>
                Navigator.of(context).popUntil((r) => r.isFirst),
            style: TextButton.styleFrom(
              foregroundColor: Colors.grey[600],
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
            ),
            child: const Text(
              'Cancel & Go to Home',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
            ),
          ),
        ),
      ],
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  Widget _infoRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 14, color: _primary),
        const SizedBox(width: 8),
        SizedBox(
          width: 68,
          child: Text(label,
              style: const TextStyle(
                  fontSize: 12,
                  color: Color(0xFF9E9E9E),
                  fontWeight: FontWeight.w500)),
        ),
        Expanded(
          child: Text(value,
              style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1A1A2E))),
        ),
      ],
    );
  }

  Widget _avatarCircle(String name, double size) {
    return Container(
      width: size,
      height: size,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        color: Color(0xFFEEEEEE),
      ),
      child: Center(
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : 'D',
          style: TextStyle(
              fontSize: size * 0.42,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF9E9E9E)),
        ),
      ),
    );
  }

  BoxDecoration _cardDecoration() {
    return BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.07),
          blurRadius: 16,
          offset: const Offset(0, 4),
        ),
      ],
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
