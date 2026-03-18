import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../data/models/doctor_availability_model.dart';
import '../../../data/models/doctor_model.dart';
import '../../providers/auth_provider.dart';
import 'payment_screen.dart';

const Color _primary = Color(0xFF2E7D32);
const Color _bg = Color(0xFFF4FAF4);

class AppointmentRegistrationScreen extends StatefulWidget {
  final Doctor doctor;
  final HospitalAvailability hospital;
  final DateSlotSummary slot;

  const AppointmentRegistrationScreen({
    super.key,
    required this.doctor,
    required this.hospital,
    required this.slot,
  });

  @override
  State<AppointmentRegistrationScreen> createState() =>
      _AppointmentRegistrationScreenState();
}

class _AppointmentRegistrationScreenState
    extends State<AppointmentRegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _idNumberCtrl = TextEditingController();

  String _title = 'Mr';
  String _idType = 'NIC';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = Provider.of<AuthProvider>(context, listen: false).user;
      if (user != null) {
        _nameCtrl.text = user['name'] ?? '';
        _emailCtrl.text = user['email'] ?? '';
        _phoneCtrl.text = user['phone'] ?? user['telephone'] ?? '';
        _idNumberCtrl.text = user['nic'] ?? user['passport'] ?? '';
        final savedTitle = user['title'] as String?;
        if (savedTitle != null &&
            ['Mr', 'Ms', 'Mrs', 'Dr'].contains(savedTitle)) {
          setState(() => _title = savedTitle);
        }
      }
    });
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _idNumberCtrl.dispose();
    super.dispose();
  }

  int get _appointmentNumber => widget.slot.bookedSlots + 1;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        title: const Text(
          'Book Appointment',
          style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
        ),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1A1A2E),
        elevation: 0,
        centerTitle: true,
        surfaceTintColor: Colors.transparent,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
          children: [
            _appointmentSummaryCard(),
            const SizedBox(height: 20),
            _sectionLabel('PATIENT DETAILS'),
            const SizedBox(height: 12),
            _patientFormCard(),
            const SizedBox(height: 28),
            _nextButton(),
          ],
        ),
      ),
    );
  }

  Widget _appointmentSummaryCard() {
    return Container(
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
      child: Column(
        children: [
          // Green gradient header with doctor info + appointment number
          Container(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [_primary, Color(0xFF43A047)],
              ),
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withValues(alpha: 0.2),
                  ),
                  child: Center(
                    child: Text(
                      widget.doctor.name.isNotEmpty
                          ? widget.doctor.name[0].toUpperCase()
                          : 'D',
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.doctor.name,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        widget.doctor.specialization,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.white.withValues(alpha: 0.85),
                        ),
                      ),
                    ],
                  ),
                ),
                // Appointment number badge
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '$_appointmentNumber',
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: _primary,
                          height: 1,
                        ),
                      ),
                      const Text(
                        'Appt No.',
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w600,
                          color: _primary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Session details rows
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
            child: Column(
              children: [
                _summaryRow(
                  icon: Icons.local_hospital_outlined,
                  label: 'Hospital',
                  value: widget.hospital.hospitalName,
                ),
                if (widget.hospital.location.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  _summaryRow(
                    icon: Icons.location_on_outlined,
                    label: 'Location',
                    value: widget.hospital.location,
                  ),
                ],
                const SizedBox(height: 10),
                _summaryRow(
                  icon: Icons.calendar_today_outlined,
                  label: 'Date',
                  value: _fmtDate(widget.slot.date),
                ),
                const SizedBox(height: 10),
                _summaryRow(
                  icon: Icons.access_time_rounded,
                  label: 'Time',
                  value: widget.slot.startTime,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _summaryRow({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 15, color: _primary),
        const SizedBox(width: 8),
        SizedBox(
          width: 70,
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              color: Color(0xFF9E9E9E),
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1A1A2E),
            ),
          ),
        ),
      ],
    );
  }

  Widget _sectionLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w800,
          color: Color(0xFF9E9E9E),
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _patientFormCard() {
    return Container(
      padding: const EdgeInsets.all(16),
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
      child: Column(
        children: [
          // Title + Full Name
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: 100,
                child: _dropdownField(
                  label: 'Title',
                  value: _title,
                  items: const ['Mr', 'Ms', 'Mrs', 'Dr'],
                  onChanged: (v) => setState(() => _title = v!),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _textField(
                  controller: _nameCtrl,
                  label: 'Full Name *',
                  icon: Icons.person_outline,
                  validator: (v) =>
                      (v == null || v.trim().isEmpty) ? 'Name is required' : null,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Email
          _textField(
            controller: _emailCtrl,
            label: 'Email Address *',
            icon: Icons.email_outlined,
            keyboardType: TextInputType.emailAddress,
            validator: (v) {
              if (v == null || v.trim().isEmpty) return 'Email is required';
              if (!RegExp(r'^[\w\.\-]+@[\w\.\-]+\.\w+$').hasMatch(v.trim())) {
                return 'Enter a valid email address';
              }
              return null;
            },
          ),
          const SizedBox(height: 14),

          // Telephone
          _textField(
            controller: _phoneCtrl,
            label: 'Telephone *',
            icon: Icons.phone_outlined,
            keyboardType: TextInputType.phone,
            validator: (v) {
              if (v == null || v.trim().isEmpty) return 'Phone number is required';
              final digits = v.trim().replaceAll(RegExp(r'[\s\-\+]'), '');
              if (!RegExp(r'^\d{9,11}$').hasMatch(digits)) {
                return 'Enter a valid phone number';
              }
              return null;
            },
          ),
          const SizedBox(height: 14),

          // ID Type + ID Number
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: 120,
                child: _dropdownField(
                  label: 'ID Type',
                  value: _idType,
                  items: const ['NIC', 'Passport'],
                  onChanged: (v) => setState(() {
                    _idType = v!;
                    _idNumberCtrl.clear();
                  }),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _textField(
                  controller: _idNumberCtrl,
                  label: '${_idType == 'NIC' ? 'NIC' : 'Passport'} Number *',
                  icon: Icons.badge_outlined,
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) {
                      return '$_idType number is required';
                    }
                    if (_idType == 'NIC') {
                      final nic = v.trim().toUpperCase();
                      if (!RegExp(r'^\d{9}[VX]$|^\d{12}$').hasMatch(nic)) {
                        return 'Invalid NIC (9+V/X or 12 digits)';
                      }
                    } else {
                      if (v.trim().length < 6) {
                        return 'Enter a valid passport number';
                      }
                    }
                    return null;
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _textField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      validator: validator,
      style: const TextStyle(fontSize: 14, color: Color(0xFF1A1A2E)),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(fontSize: 13, color: Color(0xFF9E9E9E)),
        prefixIcon: Icon(icon, size: 18, color: _primary),
        filled: true,
        fillColor: const Color(0xFFF8F8F8),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE8E8E8)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE53935)),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE53935), width: 1.5),
        ),
      ),
    );
  }

  Widget _dropdownField({
    required String label,
    required String value,
    required List<String> items,
    required void Function(String?) onChanged,
  }) {
    return DropdownButtonFormField<String>(
      key: ValueKey(value),
      initialValue: value,
      items: items
          .map((e) => DropdownMenuItem(
                value: e,
                child: Text(e, style: const TextStyle(fontSize: 14)),
              ))
          .toList(),
      onChanged: onChanged,
      style: const TextStyle(fontSize: 14, color: Color(0xFF1A1A2E)),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(fontSize: 13, color: Color(0xFF9E9E9E)),
        filled: true,
        fillColor: const Color(0xFFF8F8F8),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE8E8E8)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _primary, width: 1.5),
        ),
      ),
    );
  }

  Widget _nextButton() {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton(
        onPressed: _onNext,
        style: ElevatedButton.styleFrom(
          backgroundColor: _primary,
          foregroundColor: Colors.white,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          elevation: 0,
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Next',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            SizedBox(width: 8),
            Icon(Icons.arrow_forward_rounded, size: 20),
          ],
        ),
      ),
    );
  }

  void _onNext() {
    if (!_formKey.currentState!.validate()) return;

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => PaymentScreen(
          doctor: widget.doctor,
          hospital: widget.hospital,
          slot: widget.slot,
          appointmentNumber: _appointmentNumber,
          patient: {
            'title': _title,
            'name': _nameCtrl.text.trim(),
            'email': _emailCtrl.text.trim(),
            'phone': _phoneCtrl.text.trim(),
            'idType': _idType,
            'idNumber': _idNumberCtrl.text.trim().toUpperCase(),
          },
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
