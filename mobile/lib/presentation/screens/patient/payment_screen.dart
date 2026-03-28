import 'dart:convert';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/constants/app_constants.dart';
import '../../../data/models/doctor_availability_model.dart';
import '../../../data/models/doctor_model.dart';
import '../../../src/core/payment_service.dart';
import 'payment_declined_screen.dart';
import 'payment_success_screen.dart';

const Color _primary = Color(0xFF2E7D32);
const Color _bg = Color(0xFFF4FAF4);

// Fallback fee constants when session data has no fee breakdown (LKR)
const double _fallbackHospitalCharge = 500.0;
const double _fallbackChangelingCharge = 300.0;

enum _PayMethod { creditCard, debitCard, onlineBanking, mobileWallet }

class PaymentScreen extends ConsumerStatefulWidget {
  final Doctor doctor;
  final HospitalAvailability hospital;
  final DateSlotSummary slot;
  final int appointmentNumber;
  final Map<String, dynamic> patient;

  const PaymentScreen({
    super.key,
    required this.doctor,
    required this.hospital,
    required this.slot,
    required this.appointmentNumber,
    required this.patient,
  });

  @override
  ConsumerState<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends ConsumerState<PaymentScreen> {
  _PayMethod _selectedMethod = _PayMethod.creditCard;
  final _cardFormKey = GlobalKey<FormState>();

  // Card fields
  final _cardNumberCtrl = TextEditingController();
  final _cardHolderCtrl = TextEditingController();
  final _expiryCtrl = TextEditingController();
  final _cvvCtrl = TextEditingController();

  // Online banking
  String _selectedBank = 'Bank of Ceylon';

  // Mobile wallet
  String _selectedWallet = 'Dialog Pay';
  final _walletPhoneCtrl = TextEditingController();

  bool _isProcessing = false;

  double get _doctorFee => widget.slot.totalAmount > 0
      ? widget.slot.doctorFee
      : (widget.doctor.consultationFee > 0 ? widget.doctor.consultationFee : 1500.0);
  double get _hospitalCharge => widget.slot.totalAmount > 0
      ? widget.slot.hospitalCharge
      : _fallbackHospitalCharge;
  double get _channelingCharge => widget.slot.totalAmount > 0
      ? widget.slot.channelingFee
      : _fallbackChangelingCharge;
  double get _totalAmount => widget.slot.totalAmount > 0
      ? widget.slot.totalAmount
      : _doctorFee + _hospitalCharge + _channelingCharge;

  @override
  void dispose() {
    _cardNumberCtrl.dispose();
    _cardHolderCtrl.dispose();
    _expiryCtrl.dispose();
    _cvvCtrl.dispose();
    _walletPhoneCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        title: const Text(
          'Payment',
          style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
        ),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1A1A2E),
        elevation: 0,
        centerTitle: true,
        surfaceTintColor: Colors.transparent,
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 14),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: const Color(0xFFE8F5E9),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.lock_rounded, size: 12, color: _primary),
                SizedBox(width: 4),
                Text('Secure',
                    style: TextStyle(
                        fontSize: 11,
                        color: _primary,
                        fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
      ),
      body: Form(
        key: _cardFormKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
          children: [
            _sectionLabel('APPOINTMENT SUMMARY'),
            const SizedBox(height: 12),
            _summaryCard(),
            const SizedBox(height: 20),
            _sectionLabel('PAYMENT BREAKDOWN'),
            const SizedBox(height: 12),
            _feeBreakdownCard(),
            const SizedBox(height: 20),
            _sectionLabel('PAYMENT METHOD'),
            const SizedBox(height: 12),
            _paymentMethodSelector(),
            const SizedBox(height: 14),
            _paymentMethodForm(),
            const SizedBox(height: 28),
            _payNowButton(),
          ],
        ),
      ),
    );
  }

  // ── Summary card ────────────────────────────────────────────────────────────

  Widget _summaryCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: _cardDecoration(),
      child: Column(
        children: [
          Row(
            children: [
              _avatarCircle(widget.doctor.name, 44),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(widget.doctor.name,
                        style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1A1A2E))),
                    const SizedBox(height: 2),
                    Text(widget.doctor.specialization,
                        style: const TextStyle(
                            fontSize: 12, color: _primary, fontWeight: FontWeight.w500)),
                  ],
                ),
              ),
              _apptBadge(),
            ],
          ),
          const SizedBox(height: 14),
          const Divider(height: 1, color: Color(0xFFF0F0F0)),
          const SizedBox(height: 12),
          _infoRow(Icons.local_hospital_outlined, 'Hospital',
              widget.hospital.hospitalName),
          const SizedBox(height: 8),
          _infoRow(Icons.calendar_today_outlined, 'Date',
              _fmtDate(widget.slot.date)),
          const SizedBox(height: 8),
          _infoRow(Icons.access_time_rounded, 'Time', widget.slot.startTime),
        ],
      ),
    );
  }

  // ── Fee breakdown ────────────────────────────────────────────────────────────

  Widget _feeBreakdownCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: _cardDecoration(),
      child: Column(
        children: [
          _feeRow('Doctor Fee', _doctorFee),
          const SizedBox(height: 10),
          _feeRow('Hospital Charge', _hospitalCharge),
          const SizedBox(height: 10),
          _feeRow('Channeling Charge', _channelingCharge),
          const SizedBox(height: 12),
          const Divider(height: 1, color: Color(0xFFEEEEEE)),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Total Amount',
                  style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1A1A2E))),
              Text(
                'LKR ${_totalAmount.toStringAsFixed(2)}',
                style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: _primary),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _feeRow(String label, double amount) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label,
            style:
                const TextStyle(fontSize: 13, color: Color(0xFF666666))),
        Text('LKR ${amount.toStringAsFixed(2)}',
            style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1A1A2E))),
      ],
    );
  }

  // ── Payment method selector ───────────────────────────────────────────────

  Widget _paymentMethodSelector() {
    final methods = [
      (_PayMethod.creditCard, Icons.credit_card_rounded, 'Credit Card'),
      (_PayMethod.debitCard, Icons.credit_card_outlined, 'Debit Card'),
      (_PayMethod.onlineBanking, Icons.account_balance_outlined, 'Online Banking'),
      (_PayMethod.mobileWallet, Icons.phone_android_rounded, 'Mobile Wallet'),
    ];

    return GridView.count(
      crossAxisCount: 2,
      childAspectRatio: 2.8,
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      children: methods.map((m) {
        final selected = _selectedMethod == m.$1;
        return GestureDetector(
          onTap: () => setState(() => _selectedMethod = m.$1),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            decoration: BoxDecoration(
              color: selected ? const Color(0xFFE8F5E9) : Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: selected ? _primary : const Color(0xFFE8E8E8),
                width: selected ? 2 : 1,
              ),
              boxShadow: selected
                  ? [
                      BoxShadow(
                        color: _primary.withValues(alpha: 0.15),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      )
                    ]
                  : [],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(m.$2,
                    size: 18,
                    color: selected ? _primary : const Color(0xFF9E9E9E)),
                const SizedBox(width: 6),
                Text(m.$3,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight:
                          selected ? FontWeight.w700 : FontWeight.w500,
                      color: selected ? _primary : const Color(0xFF666666),
                    )),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  // ── Payment method forms ──────────────────────────────────────────────────

  Widget _paymentMethodForm() {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 220),
      child: Container(
        key: ValueKey(_selectedMethod),
        padding: const EdgeInsets.all(16),
        decoration: _cardDecoration(),
        child: switch (_selectedMethod) {
          _PayMethod.creditCard || _PayMethod.debitCard => _cardForm(),
          _PayMethod.onlineBanking => _bankingForm(),
          _PayMethod.mobileWallet => _walletForm(),
        },
      ),
    );
  }

  Widget _cardForm() {
    final isCredit = _selectedMethod == _PayMethod.creditCard;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _formLabel(isCredit ? 'Credit Card Details' : 'Debit Card Details'),
        const SizedBox(height: 14),
        _formField(
          controller: _cardNumberCtrl,
          label: 'Card Number',
          icon: Icons.credit_card_rounded,
          hint: '1234 5678 9012 3456',
          keyboardType: TextInputType.number,
          inputFormatters: [
            FilteringTextInputFormatter.digitsOnly,
            _CardNumberFormatter(),
          ],
          maxLength: 19,
          validator: (v) {
            final digits = (v ?? '').replaceAll(' ', '');
            if (digits.length != 16) return 'Enter a valid 16-digit card number';
            return null;
          },
        ),
        const SizedBox(height: 12),
        _formField(
          controller: _cardHolderCtrl,
          label: 'Cardholder Name',
          icon: Icons.person_outline_rounded,
          hint: 'As printed on card',
          textCapitalization: TextCapitalization.characters,
          validator: (v) =>
              (v == null || v.trim().isEmpty) ? 'Cardholder name required' : null,
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _formField(
                controller: _expiryCtrl,
                label: 'Expiry Date',
                icon: Icons.date_range_outlined,
                hint: 'MM/YY',
                keyboardType: TextInputType.number,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  _ExpiryFormatter(),
                ],
                maxLength: 5,
                validator: (v) {
                  if (v == null || v.length < 5) return 'Enter MM/YY';
                  return null;
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _formField(
                controller: _cvvCtrl,
                label: 'CVV',
                icon: Icons.lock_outline_rounded,
                hint: '• • •',
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                maxLength: 4,
                obscureText: true,
                validator: (v) {
                  if (v == null || v.length < 3) return 'Invalid CVV';
                  return null;
                },
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _bankingForm() {
    final banks = [
      'Bank of Ceylon', 'People\'s Bank', 'Commercial Bank',
      'Sampath Bank', 'HNB', 'NSB', 'Seylan Bank', 'Nations Trust Bank',
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _formLabel('Online Banking'),
        const SizedBox(height: 14),
        DropdownButtonFormField<String>(
          key: ValueKey(_selectedBank),
          initialValue: _selectedBank,
          items: banks
              .map((b) => DropdownMenuItem(
                    value: b,
                    child: Text(b, style: const TextStyle(fontSize: 14)),
                  ))
              .toList(),
          onChanged: (v) => setState(() => _selectedBank = v!),
          style: const TextStyle(fontSize: 14, color: Color(0xFF1A1A2E)),
          decoration: _inputDecoration('Select Bank', Icons.account_balance_outlined),
          validator: (v) => v == null ? 'Select a bank' : null,
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFFFFF8E1),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: const Color(0xFFFFE082)),
          ),
          child: const Row(
            children: [
              Icon(Icons.info_outline_rounded,
                  size: 16, color: Color(0xFFF57C00)),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'You will be redirected to your bank\'s secure portal to complete payment.',
                  style:
                      TextStyle(fontSize: 12, color: Color(0xFF795548), height: 1.4),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _walletForm() {
    final wallets = ['Dialog Pay', 'FriMi', 'eZ Cash', 'mCash', 'iPay'];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _formLabel('Mobile Wallet'),
        const SizedBox(height: 14),
        DropdownButtonFormField<String>(
          key: ValueKey(_selectedWallet),
          initialValue: _selectedWallet,
          items: wallets
              .map((w) => DropdownMenuItem(
                    value: w,
                    child: Text(w, style: const TextStyle(fontSize: 14)),
                  ))
              .toList(),
          onChanged: (v) => setState(() => _selectedWallet = v!),
          style: const TextStyle(fontSize: 14, color: Color(0xFF1A1A2E)),
          decoration: _inputDecoration('Select Wallet', Icons.phone_android_rounded),
          validator: (v) => v == null ? 'Select a wallet' : null,
        ),
        const SizedBox(height: 12),
        _formField(
          controller: _walletPhoneCtrl,
          label: 'Mobile Number',
          icon: Icons.phone_outlined,
          hint: '07X XXX XXXX',
          keyboardType: TextInputType.phone,
          validator: (v) {
            if (v == null || v.trim().isEmpty) return 'Mobile number required';
            final digits = v.trim().replaceAll(RegExp(r'[\s\-]'), '');
            if (!RegExp(r'^\d{9,10}$').hasMatch(digits)) {
              return 'Enter a valid mobile number';
            }
            return null;
          },
        ),
      ],
    );
  }

  // ── Pay Now button ────────────────────────────────────────────────────────

  Widget _payNowButton() {
    return SizedBox(
      width: double.infinity,
      height: 54,
      child: ElevatedButton(
        onPressed: _isProcessing ? null : _onPayNow,
        style: ElevatedButton.styleFrom(
          backgroundColor: _primary,
          foregroundColor: Colors.white,
          disabledBackgroundColor: const Color(0xFF81C784),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          elevation: 0,
        ),
        child: _isProcessing
            ? const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white),
                  ),
                  SizedBox(width: 12),
                  Text('Processing...',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                ],
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.lock_rounded, size: 18),
                  const SizedBox(width: 8),
                  Text(
                    'Pay Now  LKR ${_totalAmount.toStringAsFixed(2)}',
                    style: const TextStyle(
                        fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                ],
              ),
      ),
    );
  }

  /// Books the appointment and returns its ID.
  Future<String> _bookAppointment() async {
    final sessionId = widget.slot.sessionId;
    if (sessionId == null) throw Exception('No session selected.');

    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(AppConstants.tokenKey);

    final baseUrl = kIsWeb ? 'http://localhost:5000' : AppConstants.baseUrl;
    final response = await http.post(
      Uri.parse('$baseUrl/api/v1/channeling-sessions/$sessionId/book'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'symptoms': widget.patient['symptoms'] ?? ''}),
    );

    final body = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode != 201) {
      throw Exception('Booking failed: ${body['error'] ?? 'Unknown error'}');
    }
    final data = body['data'];
    String? appointmentId;
    if (data is Map<String, dynamic>) {
      final rawId = data['_id'] ?? data['appointmentId'] ?? data['id'];
      if (rawId is String && rawId.trim().isNotEmpty) {
        appointmentId = rawId;
      }
    }
    if (appointmentId == null) {
      throw Exception('Appointment ID missing from response.');
    }
    return appointmentId;
  }

  void _onPayNow() async {
    setState(() => _isProcessing = true);

    try {
      final appointmentId = await _bookAppointment();

      final paymentService = ref.read(paymentServiceProvider);
      await paymentService.processAppointmentPayment(
        appointmentId: appointmentId,
        onSuccess: () {
          if (!mounted) return;
          setState(() => _isProcessing = false);
          final txnId = _generateTransactionId();
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (_) => PaymentSuccessScreen(
                doctor: widget.doctor,
                hospital: widget.hospital,
                slot: widget.slot,
                appointmentNumber: widget.appointmentNumber,
                patient: widget.patient,
                doctorFee: _doctorFee,
                hospitalCharge: _hospitalCharge,
                channelingCharge: _channelingCharge,
                totalAmount: _totalAmount,
                transactionId: txnId,
                paymentMethod: _methodLabel(_selectedMethod),
                paidAt: DateTime.now(),
              ),
            ),
          );
        },
        onError: (error) {
          if (!mounted) return;
          setState(() => _isProcessing = false);
          if (!mounted) return;
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (_) => PaymentDeclinedScreen(
                doctor: widget.doctor,
                hospital: widget.hospital,
                slot: widget.slot,
                appointmentNumber: widget.appointmentNumber,
                patient: widget.patient,
                totalAmount: _totalAmount,
                reason: error,
              ),
            ),
          );
        },
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _isProcessing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
      );
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  Widget _formLabel(String text) {
    return Text(text,
        style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: Color(0xFF1A1A2E)));
  }

  Widget _formField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    String? hint,
    TextInputType? keyboardType,
    List<TextInputFormatter>? inputFormatters,
    int? maxLength,
    bool obscureText = false,
    TextCapitalization textCapitalization = TextCapitalization.none,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      inputFormatters: inputFormatters,
      maxLength: maxLength,
      obscureText: obscureText,
      textCapitalization: textCapitalization,
      validator: validator,
      style: const TextStyle(fontSize: 14, color: Color(0xFF1A1A2E)),
      decoration: _inputDecoration(label, icon, hint: hint, maxLength: maxLength),
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon,
      {String? hint, int? maxLength}) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
      labelStyle: const TextStyle(fontSize: 13, color: Color(0xFF9E9E9E)),
      hintStyle: const TextStyle(fontSize: 13, color: Color(0xFFBBBBBB)),
      prefixIcon: Icon(icon, size: 18, color: _primary),
      filled: true,
      fillColor: const Color(0xFFF8F8F8),
      counterText: '',
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
      enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE8E8E8))),
      focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _primary, width: 1.5)),
      errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE53935))),
      focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE53935), width: 1.5)),
    );
  }

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

  Widget _apptBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFE8F5E9),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('${widget.appointmentNumber}',
              style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: _primary,
                  height: 1)),
          const Text('Appt No.',
              style: TextStyle(
                  fontSize: 9, fontWeight: FontWeight.w600, color: _primary)),
        ],
      ),
    );
  }

  Widget _avatarCircle(String name, double size) {
    return Container(
      width: size,
      height: size,
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
          name.isNotEmpty ? name[0].toUpperCase() : 'D',
          style: TextStyle(
              fontSize: size * 0.42,
              fontWeight: FontWeight.bold,
              color: _primary),
        ),
      ),
    );
  }

  Widget _sectionLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Text(text,
          style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: Color(0xFF9E9E9E),
              letterSpacing: 1.2)),
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

  static String _generateTransactionId() {
    final now = DateTime.now();
    final ms = now.millisecondsSinceEpoch % 100000;
    return 'TXN${now.year}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}${ms.toString().padLeft(5, '0')}';
  }

  static String _methodLabel(_PayMethod m) => switch (m) {
        _PayMethod.creditCard => 'Credit Card',
        _PayMethod.debitCard => 'Debit Card',
        _PayMethod.onlineBanking => 'Online Banking',
        _PayMethod.mobileWallet => 'Mobile Wallet',
      };

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

// ── Input formatters ──────────────────────────────────────────────────────────

class _CardNumberFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
      TextEditingValue old, TextEditingValue newVal) {
    final digits = newVal.text.replaceAll(' ', '');
    final buffer = StringBuffer();
    for (int i = 0; i < digits.length; i++) {
      if (i > 0 && i % 4 == 0) buffer.write(' ');
      buffer.write(digits[i]);
    }
    final str = buffer.toString();
    return newVal.copyWith(
      text: str,
      selection: TextSelection.collapsed(offset: str.length),
    );
  }
}

class _ExpiryFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
      TextEditingValue old, TextEditingValue newVal) {
    final digits = newVal.text.replaceAll('/', '');
    final buffer = StringBuffer();
    for (int i = 0; i < digits.length && i < 4; i++) {
      if (i == 2) buffer.write('/');
      buffer.write(digits[i]);
    }
    final str = buffer.toString();
    return newVal.copyWith(
      text: str,
      selection: TextSelection.collapsed(offset: str.length),
    );
  }
}
