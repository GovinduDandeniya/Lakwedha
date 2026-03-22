import 'package:flutter/material.dart';
import '../../data/datasources/remote/api_service.dart';
import '../../data/models/doctor_availability_model.dart';

const Color _primary = Color(0xFF2E7D32);

class ExtraAppointmentRequestScreen extends StatefulWidget {
  final String doctorId;
  final String doctorName;
  final DateSlotSummary slot;
  final String hospitalName;

  const ExtraAppointmentRequestScreen({
    super.key,
    required this.doctorId,
    required this.doctorName,
    required this.slot,
    required this.hospitalName,
  });

  @override
  State<ExtraAppointmentRequestScreen> createState() =>
      _ExtraAppointmentRequestScreenState();
}

class _ExtraAppointmentRequestScreenState
    extends State<ExtraAppointmentRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  final _reasonController = TextEditingController();
  final _urgencyController = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _reasonController.dispose();
    _urgencyController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (widget.slot.sessionId == null) {
      _showError('Session information is missing. Please try again.');
      return;
    }

    setState(() => _submitting = true);
    try {
      await ApiService().submitExtraRequest(
        sessionId: widget.slot.sessionId!,
        reason: _reasonController.text.trim(),
        urgencyNote: _urgencyController.text.trim(),
      );
      if (!mounted) return;
      Navigator.pop(context, true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Request submitted. The doctor will review it shortly.'),
          backgroundColor: _primary,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      _showError(e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: Colors.red[700],
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4FAF4),
      appBar: AppBar(
        title: const Text(
          'Request Extra Appointment',
          style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
        ),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1A1A2E),
        elevation: 0,
        centerTitle: true,
        surfaceTintColor: Colors.transparent,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Info banner
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF8E1),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFFFCC02), width: 1),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.info_outline_rounded,
                        color: Color(0xFFF57C00), size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Session is fully booked',
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                              color: Color(0xFFE65100),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'You can request an extra appointment. '
                            'The doctor will review your request and respond.',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[700],
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Session details card
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 10,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    _detailRow(Icons.person_outline, 'Doctor',
                        widget.doctorName),
                    const Divider(height: 16),
                    _detailRow(Icons.local_hospital_outlined, 'Hospital',
                        widget.hospitalName),
                    const Divider(height: 16),
                    _detailRow(Icons.calendar_today_outlined, 'Date',
                        _formatDate(widget.slot.date)),
                    const Divider(height: 16),
                    _detailRow(Icons.access_time_outlined, 'Time',
                        widget.slot.startTime),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Reason field
              const Text(
                'Reason for Request *',
                style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1A1A2E)),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _reasonController,
                maxLines: 4,
                maxLength: 500,
                decoration: _inputDecoration(
                    'Briefly describe your medical concern or reason for needing this appointment...'),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) {
                    return 'Please describe your reason';
                  }
                  if (v.trim().length < 10) {
                    return 'Please provide more detail (at least 10 characters)';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Urgency note field
              const Text(
                'Urgency Note (optional)',
                style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1A1A2E)),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _urgencyController,
                maxLines: 2,
                maxLength: 300,
                decoration: _inputDecoration(
                    'Any additional urgency details for the doctor...'),
              ),
              const SizedBox(height: 32),

              // Submit button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _submitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFF57C00),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  child: _submitting
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                              strokeWidth: 2.5, color: Colors.white),
                        )
                      : const Text(
                          'Submit Request',
                          style: TextStyle(
                              fontSize: 15, fontWeight: FontWeight.w700),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _detailRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 16, color: _primary),
        const SizedBox(width: 8),
        Text(label,
            style: const TextStyle(fontSize: 12, color: Color(0xFF888888))),
        const Spacer(),
        Text(value,
            style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1A1A2E))),
      ],
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(fontSize: 13, color: Colors.grey[400]),
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE0E0E0)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE0E0E0)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: _primary, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.red[300]!),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.red[400]!),
      ),
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
    );
  }

  static String _formatDate(String dateStr) {
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
