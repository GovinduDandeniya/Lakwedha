import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/services/auth_service.dart';
import '../../../presentation/widgets/lakwedha_logo.dart';

// ── Country data ─────────────────────────────────────────────────────────────
const _kCountries = <Map<String, String>>[
  {'name': 'Sri Lanka',            'nat': 'Sri Lankan',    'code': 'LK', 'dial': '+94'},
  {'name': 'India',                'nat': 'Indian',        'code': 'IN', 'dial': '+91'},
  {'name': 'United Kingdom',       'nat': 'British',       'code': 'GB', 'dial': '+44'},
  {'name': 'United States',        'nat': 'American',      'code': 'US', 'dial': '+1'},
  {'name': 'Australia',            'nat': 'Australian',    'code': 'AU', 'dial': '+61'},
  {'name': 'Canada',               'nat': 'Canadian',      'code': 'CA', 'dial': '+1'},
  {'name': 'Germany',              'nat': 'German',        'code': 'DE', 'dial': '+49'},
  {'name': 'France',               'nat': 'French',        'code': 'FR', 'dial': '+33'},
  {'name': 'Japan',                'nat': 'Japanese',      'code': 'JP', 'dial': '+81'},
  {'name': 'China',                'nat': 'Chinese',       'code': 'CN', 'dial': '+86'},
  {'name': 'United Arab Emirates', 'nat': 'Emirati',       'code': 'AE', 'dial': '+971'},
  {'name': 'Singapore',            'nat': 'Singaporean',   'code': 'SG', 'dial': '+65'},
  {'name': 'Malaysia',             'nat': 'Malaysian',     'code': 'MY', 'dial': '+60'},
  {'name': 'Pakistan',             'nat': 'Pakistani',     'code': 'PK', 'dial': '+92'},
  {'name': 'Bangladesh',           'nat': 'Bangladeshi',   'code': 'BD', 'dial': '+880'},
  {'name': 'Maldives',             'nat': 'Maldivian',     'code': 'MV', 'dial': '+960'},
];

String _flag(String iso) => String.fromCharCodes(
    iso.toUpperCase().codeUnits.map((c) => c + 127397));

InputDecoration _inputDeco(String hint) => InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: AppColors.textLight, fontSize: 14),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      filled: true,
      fillColor: AppColors.textFieldBg,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.accent, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Colors.red),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Colors.red, width: 2),
      ),
    );

// ─────────────────────────────────────────────────────────────────────────────
//  SignUpScreen
// ─────────────────────────────────────────────────────────────────────────────
class SignUpScreen extends StatefulWidget {
  const SignUpScreen({super.key});

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  int    _step      = 1;
  bool   _isLoading = false;
  String _error     = '';
  final  _fieldErrors = <String, String>{};

  // ── Step 1 fields ───────────────────────────────────────────────────────
  String _nationality   = 'Sri Lankan';
  String _countryDial   = '+94';
  final  _firstNameCtrl = TextEditingController();
  final  _lastNameCtrl  = TextEditingController();
  final  _phoneCtrl     = TextEditingController();

  // ── Step 2 — OTP ────────────────────────────────────────────────────────
  final  _otpCtrl        = List.generate(5, (_) => TextEditingController());
  final  _otpFocus       = List.generate(5, (_) => FocusNode());
  String _maskedPhone    = '';
  String _verifyToken    = '';
  int    _expirySecs     = 0;
  int    _resendCooldown = 0;
  Timer? _expiryTimer;
  Timer? _resendTimer;

  // ── Step 3 fields ───────────────────────────────────────────────────────
  String    _title     = 'Mr';
  DateTime? _birthday;
  String    _nicType   = 'NIC';
  bool      _showPw    = false;
  bool      _showCpw   = false;
  final  _emailCtrl = TextEditingController();
  final  _nicCtrl   = TextEditingController();
  final  _pwCtrl    = TextEditingController();
  final  _cpwCtrl   = TextEditingController();

  @override
  void initState() {
    super.initState();
    _pwCtrl.addListener(() => setState(() {}));
    _cpwCtrl.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _nicCtrl.dispose();
    _pwCtrl.dispose();
    _cpwCtrl.dispose();
    for (final c in _otpCtrl)  { c.dispose(); }
    for (final f in _otpFocus) { f.dispose(); }
    _expiryTimer?.cancel();
    _resendTimer?.cancel();
    super.dispose();
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  String get _otpValue => _otpCtrl.map((c) => c.text).join();

  String _localPhone() {
    final raw = _phoneCtrl.text.trim().replaceAll(RegExp(r'\D'), '');
    if (raw.startsWith('94') && raw.length >= 11) return raw.substring(2);
    return raw.replaceAll(RegExp(r'^0+'), '');
  }

  String _fmt(int s) =>
      '${(s ~/ 60).toString().padLeft(2, '0')}:${(s % 60).toString().padLeft(2, '0')}';

  int _pwStrength(String pw) {
    int s = 0;
    if (pw.length >= 8) s++;
    if (RegExp(r'[A-Z]').hasMatch(pw)) s++;
    if (RegExp(r'[0-9]').hasMatch(pw)) s++;
    if (RegExp(r'[!@#\$%^&*()\-_=+\[\]{};:",.<>/?]').hasMatch(pw)) s++;
    return s;
  }

  Color _pwColor(int s) {
    if (s <= 1) return Colors.red;
    if (s == 2) return Colors.orange;
    if (s == 3) return Colors.yellow.shade700;
    return Colors.green;
  }

  String _pwLabel(int s) =>
      ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][s.clamp(0, 4)];

  void _startExpiryTimer() {
    _expiryTimer?.cancel();
    setState(() => _expirySecs = 1800);
    _expiryTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() {
        if (_expirySecs > 0) { _expirySecs--; } else { _expiryTimer?.cancel(); }
      });
    });
  }

  void _startResendCooldown() {
    setState(() => _resendCooldown = 60);
    _resendTimer?.cancel();
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() {
        if (_resendCooldown > 0) { _resendCooldown--; } else { _resendTimer?.cancel(); }
      });
    });
  }

  // ── API calls ─────────────────────────────────────────────────────────────

  Future<void> _sendOtp() async {
    final errs = <String, String>{};
    if (_firstNameCtrl.text.trim().isEmpty) errs['firstName'] = 'First name is required.';
    if (_lastNameCtrl.text.trim().isEmpty)  errs['lastName']  = 'Last name is required.';
    final lp = _localPhone();
    if (lp.isEmpty) {
      errs['phone'] = 'Mobile number is required.';
    } else if (!RegExp(r'^\d{7,13}$').hasMatch(lp)) {
      errs['phone'] = 'Enter a valid mobile number.';
    }
    if (errs.isNotEmpty) {
      setState(() { _fieldErrors.addAll(errs); _error = ''; });
      return;
    }
    setState(() { _fieldErrors.clear(); _error = ''; _isLoading = true; });
    try {
      final data = await AuthService.sendRegistrationOtp(
        phone: lp,
        countryCode: _countryDial,
      );
      _maskedPhone = data['maskedPhone'] as String? ?? '';
      for (final c in _otpCtrl) { c.clear(); }
      _startExpiryTimer();
      _startResendCooldown();
      setState(() => _step = 2);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _verifyOtp() async {
    if (_otpValue.length < 5) {
      setState(() => _error = 'Please enter the complete 5-digit OTP.');
      return;
    }
    if (_expirySecs == 0) {
      setState(() => _error = 'OTP has expired. Please request a new one.');
      return;
    }
    setState(() { _error = ''; _isLoading = true; });
    try {
      _verifyToken = await AuthService.verifyRegistrationOtp(
        phone: _localPhone(),
        countryCode: _countryDial,
        otp: _otpValue,
      );
      _expiryTimer?.cancel();
      setState(() => _step = 3);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _resendOtp() async {
    if (_resendCooldown > 0 || _isLoading) return;
    setState(() { _error = ''; _isLoading = true; });
    try {
      final data = await AuthService.sendRegistrationOtp(
        phone: _localPhone(),
        countryCode: _countryDial,
      );
      _maskedPhone = data['maskedPhone'] as String? ?? '';
      for (final c in _otpCtrl) { c.clear(); }
      _startExpiryTimer();
      _startResendCooldown();
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _register() async {
    final errs = <String, String>{};
    final email = _emailCtrl.text.trim();
    if (email.isEmpty) {
      errs['email'] = 'Email is required.';
    } else if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email)) {
      errs['email'] = 'Enter a valid email address.';
    }
    if (_birthday == null) errs['birthday'] = 'Date of birth is required.';
    if (_nicCtrl.text.trim().isEmpty) errs['nic'] = '$_nicType number is required.';
    final pw = _pwCtrl.text;
    if (pw.isEmpty) {
      errs['password'] = 'Password is required.';
    } else if (_pwStrength(pw) < 4) {
      errs['password'] = 'Password does not meet all requirements.';
    }
    if (_cpwCtrl.text.isEmpty) {
      errs['confirmPassword'] = 'Please confirm your password.';
    } else if (pw != _cpwCtrl.text) {
      errs['confirmPassword'] = 'Passwords do not match.';
    }
    if (errs.isNotEmpty) {
      setState(() { _fieldErrors.addAll(errs); _error = ''; });
      return;
    }
    setState(() { _fieldErrors.clear(); _error = ''; _isLoading = true; });
    try {
      final b    = _birthday!;
      final bStr = '${b.year.toString().padLeft(4, '0')}-'
          '${b.month.toString().padLeft(2, '0')}-'
          '${b.day.toString().padLeft(2, '0')}';
      await AuthService.registerWithOtp(
        verifyToken: _verifyToken,
        title:       _title,
        firstName:   _firstNameCtrl.text.trim(),
        lastName:    _lastNameCtrl.text.trim(),
        nationality: _nationality,
        phone:       _localPhone(),
        countryCode: _countryDial,
        email:       email,
        birthday:    bStr,
        nicType:     _nicType,
        nicNumber:   _nicCtrl.text.trim(),
        password:    pw,
      );
      setState(() => _step = 4);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  // ── Styled dropdown (avoids deprecated DropdownButtonFormField.value) ────────

  Widget _styledDropdown<T>({
    required T value,
    required List<DropdownMenuItem<T>> items,
    required ValueChanged<T?> onChanged,
  }) =>
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
        decoration: BoxDecoration(
          color: AppColors.textFieldBg,
          border: Border.all(color: AppColors.border),
          borderRadius: BorderRadius.circular(8),
        ),
        child: DropdownButton<T>(
          value: value,
          isExpanded: true,
          underline: const SizedBox(),
          items: items,
          onChanged: onChanged,
          style: const TextStyle(fontSize: 14, color: AppColors.textDark),
          dropdownColor: Colors.white,
          borderRadius: BorderRadius.circular(8),
        ),
      );

  // ── Shared UI helpers ─────────────────────────────────────────────────────

  Widget _card(Widget child) => Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
        decoration: BoxDecoration(
          color: AppColors.backgroundBlur,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.25),
              blurRadius: 30,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: child,
      );

  Widget _fieldWrap({
    required String label,
    required Widget child,
    String? error,
    EdgeInsets padding = const EdgeInsets.only(bottom: 14),
  }) =>
      Padding(
        padding: padding,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label,
                style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textDark)),
            const SizedBox(height: 6),
            child,
            if (error != null && error.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 4, left: 2),
                child: Text(error,
                    style: const TextStyle(fontSize: 11, color: Colors.red)),
              ),
          ],
        ),
      );

  Widget _errorBox() {
    if (_error.isEmpty) return const SizedBox.shrink();
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.red.shade200),
      ),
      child: Row(
        children: [
          Icon(Icons.warning_amber_rounded, size: 16, color: Colors.red.shade700),
          const SizedBox(width: 8),
          Expanded(
            child: Text(_error,
                style: TextStyle(fontSize: 13, color: Colors.red.shade700)),
          ),
        ],
      ),
    );
  }

  Widget _primaryBtn(String label, VoidCallback onTap) => SizedBox(
        width: double.infinity,
        height: 48,
        child: ElevatedButton(
          onPressed: _isLoading ? null : onTap,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.accent,
            disabledBackgroundColor: AppColors.accent.withValues(alpha: 0.5),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
          child: _isLoading
              ? const SizedBox(
                  width: 22, height: 22,
                  child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white)),
                )
              : Text(label,
                  style: GoogleFonts.inter(
                      fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
        ),
      );

  Widget _stepIndicator() {
    const labels = ['Details', 'Verify', 'Profile', 'Done'];
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(4, (i) {
        final n      = i + 1;
        final done   = n < _step;
        final active = n == _step;
        return Row(children: [
          Column(children: [
            Container(
              width: 30, height: 30,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: (done || active) ? AppColors.accent : Colors.grey.shade300,
              ),
              child: Center(
                child: done
                    ? const Icon(Icons.check, size: 15, color: Colors.white)
                    : Text('$n',
                        style: TextStyle(
                          fontSize: 12, fontWeight: FontWeight.bold,
                          color: active ? Colors.white : Colors.grey.shade500,
                        )),
              ),
            ),
            const SizedBox(height: 4),
            Text(labels[i],
                style: TextStyle(
                  fontSize: 9,
                  color: (done || active) ? AppColors.accent : Colors.grey.shade400,
                  fontWeight: active ? FontWeight.w600 : FontWeight.normal,
                )),
          ]),
          if (i < 3)
            Container(
              width: 28, height: 2,
              margin: const EdgeInsets.only(bottom: 14),
              color: n < _step ? AppColors.accent : Colors.grey.shade300,
            ),
        ]);
      }),
    );
  }

  // ── OTP boxes ─────────────────────────────────────────────────────────────

  Widget _otpBoxes() => Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(5, (i) {
          final filled = _otpCtrl[i].text.isNotEmpty;
          return Container(
            width: 52, height: 60,
            margin: const EdgeInsets.symmetric(horizontal: 4),
            child: TextField(
              controller: _otpCtrl[i],
              focusNode: _otpFocus[i],
              textAlign: TextAlign.center,
              keyboardType: TextInputType.number,
              maxLength: 1,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              style: GoogleFonts.inter(
                  fontSize: 22, fontWeight: FontWeight.bold,
                  color: AppColors.textDark),
              decoration: InputDecoration(
                counterText: '',
                filled: true,
                fillColor: filled
                    ? AppColors.accent.withValues(alpha: 0.08)
                    : AppColors.textFieldBg,
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(
                      color: filled ? AppColors.accent : AppColors.border),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: AppColors.accent, width: 2),
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: AppColors.border),
                ),
              ),
              onChanged: (val) {
                if (val.isNotEmpty && i < 4) _otpFocus[i + 1].requestFocus();
                if (val.isEmpty && i > 0)    _otpFocus[i - 1].requestFocus();
                setState(() {});
              },
            ),
          );
        }),
      );

  // ────────────────────────────────────────────────────────────────────────
  //  STEP 1 – Basic Details
  // ────────────────────────────────────────────────────────────────────────

  Widget _buildStep1() => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Basic Details',
              style: GoogleFonts.playfairDisplay(
                  fontSize: 22, fontWeight: FontWeight.bold,
                  color: AppColors.textDark)),
          const SizedBox(height: 4),
          Text('Tell us about yourself to get started.',
              style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMedium)),
          const SizedBox(height: 16),

          _errorBox(),

          // Nationality
          _fieldWrap(
            label: 'Nationality',
            child: _styledDropdown<String>(
              value: _nationality,
              items: _kCountries
                  .map((c) => DropdownMenuItem(
                      value: c['nat'],
                      child: Text(c['nat']!,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 14, color: AppColors.textDark))))
                  .toList(),
              onChanged: (v) => setState(() => _nationality = v!),
            ),
          ),

          // First / Last name
          Row(children: [
            Expanded(
              child: _fieldWrap(
                label: 'First Name',
                error: _fieldErrors['firstName'],
                child: TextFormField(
                  controller: _firstNameCtrl,
                  decoration: _inputDeco('First name'),
                  style: const TextStyle(fontSize: 14, color: AppColors.textDark),
                  onChanged: (_) => setState(() => _fieldErrors.remove('firstName')),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _fieldWrap(
                label: 'Last Name',
                error: _fieldErrors['lastName'],
                child: TextFormField(
                  controller: _lastNameCtrl,
                  decoration: _inputDeco('Last name'),
                  style: const TextStyle(fontSize: 14, color: AppColors.textDark),
                  onChanged: (_) => setState(() => _fieldErrors.remove('lastName')),
                ),
              ),
            ),
          ]),

          // Country code + phone
          _fieldWrap(
            label: 'Mobile Number',
            error: _fieldErrors['phone'],
            child: Row(children: [
              Container(
                height: 48,
                padding: const EdgeInsets.symmetric(horizontal: 8),
                decoration: BoxDecoration(
                  color: AppColors.textFieldBg,
                  border: Border.all(color: AppColors.border),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: DropdownButton<String>(
                  value: _countryDial,
                  underline: const SizedBox(),
                  isDense: true,
                  items: _kCountries
                      .map((c) => DropdownMenuItem(
                          value: c['dial'],
                          child: Text('${_flag(c['code']!)} ${c['dial']}',
                              style: const TextStyle(
                                  fontSize: 13, color: AppColors.textDark))))
                      .toList(),
                  onChanged: (v) => setState(() => _countryDial = v!),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextFormField(
                  controller: _phoneCtrl,
                  keyboardType: TextInputType.phone,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  decoration: _inputDeco('771234567'),
                  style: const TextStyle(fontSize: 14, color: AppColors.textDark),
                  onChanged: (_) => setState(() => _fieldErrors.remove('phone')),
                ),
              ),
            ]),
          ),

          _primaryBtn('Continue →', _sendOtp),
          const SizedBox(height: 16),

          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Text('Already have an account?  ',
                style: GoogleFonts.inter(fontSize: 13, color: AppColors.textMedium)),
            GestureDetector(
              onTap: () => Navigator.pushReplacementNamed(context, '/sign-in'),
              child: Text('Sign In',
                  style: GoogleFonts.inter(
                      fontSize: 13, fontWeight: FontWeight.bold,
                      color: AppColors.accent,
                      decoration: TextDecoration.underline,
                      decorationColor: AppColors.accent)),
            ),
          ]),
        ],
      );

  // ────────────────────────────────────────────────────────────────────────
  //  STEP 2 – OTP Verification
  // ────────────────────────────────────────────────────────────────────────

  Widget _buildStep2() {
    final expired = _expirySecs == 0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header
        Row(children: [
          GestureDetector(
            onTap: () => setState(() { _step = 1; _error = ''; }),
            child: const Icon(Icons.arrow_back_ios, size: 18, color: AppColors.textMedium),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Verify Number',
                  style: GoogleFonts.playfairDisplay(
                      fontSize: 20, fontWeight: FontWeight.bold,
                      color: AppColors.textDark)),
              Text('OTP sent to $_countryDial $_maskedPhone',
                  style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMedium)),
            ]),
          ),
        ]),
        const SizedBox(height: 16),

        _errorBox(),

        // Expiry banner
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: expired
                ? Colors.red.shade50
                : AppColors.accent.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
                color: expired
                    ? Colors.red.shade200
                    : AppColors.accent.withValues(alpha: 0.3)),
          ),
          child: Center(
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Icon(expired ? Icons.timer_off_outlined : Icons.timer_outlined,
                  size: 15,
                  color: expired ? Colors.red.shade700 : AppColors.accent),
              const SizedBox(width: 6),
              Text(
                expired ? 'OTP expired — request a new one' : 'Expires in ${_fmt(_expirySecs)}',
                style: TextStyle(
                    fontSize: 13, fontWeight: FontWeight.w500,
                    color: expired ? Colors.red.shade700 : AppColors.accent),
              ),
            ]),
          ),
        ),
        const SizedBox(height: 20),

        _otpBoxes(),
        const SizedBox(height: 20),

        _primaryBtn('Verify OTP', _verifyOtp),
        const SizedBox(height: 12),

        // Resend
        Center(
          child: TextButton.icon(
            onPressed: (_resendCooldown > 0 || _isLoading) ? null : _resendOtp,
            icon: Icon(Icons.refresh,
                size: 16,
                color: _resendCooldown > 0 ? Colors.grey : AppColors.accent),
            label: Text(
              _resendCooldown > 0
                  ? 'Resend OTP in ${_resendCooldown}s'
                  : 'Resend OTP',
              style: GoogleFonts.inter(
                  fontSize: 13,
                  color: _resendCooldown > 0 ? Colors.grey : AppColors.accent,
                  fontWeight: FontWeight.w500),
            ),
          ),
        ),

        Center(
          child: TextButton(
            onPressed: () => setState(() { _step = 1; _error = ''; }),
            child: Text('Change number',
                style: GoogleFonts.inter(
                    fontSize: 12, color: AppColors.textLight,
                    decoration: TextDecoration.underline,
                    decorationColor: AppColors.textLight)),
          ),
        ),
      ],
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  //  STEP 3 – Complete Profile
  // ────────────────────────────────────────────────────────────────────────

  Widget _buildStep3() {
    final pw       = _pwCtrl.text;
    final strength = _pwStrength(pw);
    final pwMatch  = pw.isNotEmpty && _cpwCtrl.text == pw;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Complete Profile',
            style: GoogleFonts.playfairDisplay(
                fontSize: 22, fontWeight: FontWeight.bold,
                color: AppColors.textDark)),
        const SizedBox(height: 4),
        Text('Almost done! Fill in your remaining details.',
            style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMedium)),
        const SizedBox(height: 12),

        _errorBox(),

        // Summary chip
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.accent.withValues(alpha: 0.07),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.accent.withValues(alpha: 0.3)),
          ),
          child: Row(children: [
            const Icon(Icons.check_circle_outline, size: 16, color: AppColors.accent),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                '${_firstNameCtrl.text} ${_lastNameCtrl.text}  •  $_countryDial $_maskedPhone',
                style: GoogleFonts.inter(fontSize: 12, color: AppColors.accent,
                    fontWeight: FontWeight.w500),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ]),
        ),
        const SizedBox(height: 14),

        // Title
        _fieldWrap(
          label: 'Title',
          child: _styledDropdown<String>(
            value: _title,
            items: ['Mr', 'Ms', 'Mrs', 'Dr', 'Prof']
                .map((t) => DropdownMenuItem(
                    value: t,
                    child: Text(t,
                        style: const TextStyle(fontSize: 14, color: AppColors.textDark))))
                .toList(),
            onChanged: (v) => setState(() => _title = v!),
          ),
        ),

        // Email
        _fieldWrap(
          label: 'Email Address',
          error: _fieldErrors['email'],
          child: TextFormField(
            controller: _emailCtrl,
            keyboardType: TextInputType.emailAddress,
            decoration: _inputDeco('you@example.com'),
            style: const TextStyle(fontSize: 14, color: AppColors.textDark),
            onChanged: (_) => setState(() => _fieldErrors.remove('email')),
          ),
        ),

        // Date of Birth
        _fieldWrap(
          label: 'Date of Birth',
          error: _fieldErrors['birthday'],
          child: GestureDetector(
            onTap: () async {
              final picked = await showDatePicker(
                context: context,
                initialDate: _birthday ?? DateTime(2000),
                firstDate: DateTime(1900),
                lastDate: DateTime.now(),
                builder: (ctx, child) => Theme(
                  data: Theme.of(ctx).copyWith(
                    colorScheme: const ColorScheme.light(
                      primary: AppColors.accent,
                      onSurface: AppColors.textDark,
                    ),
                  ),
                  child: child!,
                ),
              );
              if (picked != null) {
                setState(() { _birthday = picked; _fieldErrors.remove('birthday'); });
              }
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.textFieldBg,
                border: Border.all(
                    color: _fieldErrors['birthday'] != null
                        ? Colors.red
                        : AppColors.border),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text(
                  _birthday == null
                      ? 'Select date'
                      : '${_birthday!.day.toString().padLeft(2, '0')} / '
                        '${_birthday!.month.toString().padLeft(2, '0')} / '
                        '${_birthday!.year}',
                  style: TextStyle(
                      fontSize: 14,
                      color: _birthday == null ? AppColors.textLight : AppColors.textDark),
                ),
                const Icon(Icons.calendar_today_outlined,
                    size: 18, color: AppColors.textMedium),
              ]),
            ),
          ),
        ),

        // ID Type + Number
        Row(children: [
          Expanded(
            flex: 2,
            child: _fieldWrap(
              label: 'ID Type',
              child: _styledDropdown<String>(
                value: _nicType,
                items: ['NIC', 'Passport', 'Driving License']
                    .map((t) => DropdownMenuItem(
                        value: t,
                        child: Text(t,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                fontSize: 14, color: AppColors.textDark))))
                    .toList(),
                onChanged: (v) => setState(() { _nicType = v!; _fieldErrors.remove('nic'); }),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            flex: 3,
            child: _fieldWrap(
              label: '$_nicType Number',
              error: _fieldErrors['nic'],
              child: TextFormField(
                controller: _nicCtrl,
                textCapitalization: TextCapitalization.characters,
                decoration: _inputDeco('e.g. 9xxxxxxxxV'),
                style: const TextStyle(fontSize: 14, color: AppColors.textDark),
                onChanged: (_) => setState(() => _fieldErrors.remove('nic')),
              ),
            ),
          ),
        ]),

        // Password
        _fieldWrap(
          label: 'Password',
          error: _fieldErrors['password'],
          child: TextFormField(
            controller: _pwCtrl,
            obscureText: !_showPw,
            decoration: _inputDeco('Min 8 chars, A-Z, 0-9, symbol').copyWith(
              suffixIcon: IconButton(
                icon: Icon(
                    _showPw ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                    size: 20, color: AppColors.textLight),
                onPressed: () => setState(() => _showPw = !_showPw),
              ),
            ),
            style: const TextStyle(fontSize: 14, color: AppColors.textDark),
            onChanged: (_) => setState(() => _fieldErrors.remove('password')),
          ),
        ),

        // Password strength
        if (pw.isNotEmpty) ...[
          Row(children: [
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: strength / 4,
                  minHeight: 6,
                  backgroundColor: Colors.grey.shade200,
                  valueColor: AlwaysStoppedAnimation<Color>(_pwColor(strength)),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Text(_pwLabel(strength),
                style: GoogleFonts.inter(
                    fontSize: 11, fontWeight: FontWeight.w600,
                    color: _pwColor(strength))),
          ]),
          const SizedBox(height: 6),
          ...[
            ('At least 8 characters',          pw.length >= 8),
            ('One uppercase letter (A–Z)',      RegExp(r'[A-Z]').hasMatch(pw)),
            ('One number (0–9)',                RegExp(r'[0-9]').hasMatch(pw)),
            ('One special character (!@#…)',    RegExp(r'[!@#\$%^&*()\-_=+]').hasMatch(pw)),
          ].map((r) => Padding(
                padding: const EdgeInsets.only(bottom: 2),
                child: Row(children: [
                  Icon(
                      r.$2 ? Icons.check_circle_outline : Icons.radio_button_unchecked,
                      size: 13,
                      color: r.$2 ? AppColors.success : AppColors.textLight),
                  const SizedBox(width: 6),
                  Text(r.$1,
                      style: GoogleFonts.inter(
                          fontSize: 11,
                          color: r.$2 ? AppColors.success : AppColors.textLight)),
                ]),
              )),
          const SizedBox(height: 8),
        ],

        // Confirm password
        _fieldWrap(
          label: 'Confirm Password',
          error: _fieldErrors['confirmPassword'],
          child: TextFormField(
            controller: _cpwCtrl,
            obscureText: !_showCpw,
            decoration: _inputDeco('Re-enter your password').copyWith(
              suffixIcon: IconButton(
                icon: Icon(
                    _showCpw ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                    size: 20, color: AppColors.textLight),
                onPressed: () => setState(() => _showCpw = !_showCpw),
              ),
            ),
            style: const TextStyle(fontSize: 14, color: AppColors.textDark),
            onChanged: (_) => setState(() => _fieldErrors.remove('confirmPassword')),
          ),
        ),

        if (_cpwCtrl.text.isNotEmpty) ...[
          Row(children: [
            Icon(
                pwMatch ? Icons.check_circle_outline : Icons.cancel_outlined,
                size: 14,
                color: pwMatch ? AppColors.success : AppColors.error),
            const SizedBox(width: 4),
            Text(
                pwMatch ? 'Passwords match' : 'Passwords do not match',
                style: GoogleFonts.inter(
                    fontSize: 11,
                    color: pwMatch ? AppColors.success : AppColors.error)),
          ]),
          const SizedBox(height: 10),
        ],

        _primaryBtn('Create Account', _register),
      ],
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  //  STEP 4 – Success
  // ────────────────────────────────────────────────────────────────────────

  Widget _buildStep4() => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 80, height: 80,
            decoration: BoxDecoration(
              color: AppColors.success.withValues(alpha: 0.12),
              shape: BoxShape.circle,
              border: Border.all(
                  color: AppColors.success.withValues(alpha: 0.40), width: 2),
            ),
            child: const Icon(Icons.check_circle_outline_rounded,
                size: 40, color: AppColors.success),
          ),
          const SizedBox(height: 20),
          Text('Account Created!',
              style: GoogleFonts.playfairDisplay(
                  fontSize: 26, fontWeight: FontWeight.bold,
                  color: AppColors.textDark)),
          const SizedBox(height: 10),
          Text(
            'Welcome, ${_firstNameCtrl.text}!\nYour Lakwedha account is ready.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
                fontSize: 13, color: AppColors.textMedium, height: 1.6),
          ),
          const SizedBox(height: 28),
          SizedBox(
            width: double.infinity, height: 48,
            child: ElevatedButton(
              onPressed: () =>
                  Navigator.pushReplacementNamed(context, '/sign-in'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.accent,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: Text('Sign In to Your Account',
                  style: GoogleFonts.inter(
                      fontSize: 16, fontWeight: FontWeight.w600,
                      color: Colors.white)),
            ),
          ),
        ],
      );

  // ── Root build ────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    Widget stepContent;
    switch (_step) {
      case 1: stepContent = _buildStep1(); break;
      case 2: stepContent = _buildStep2(); break;
      case 3: stepContent = _buildStep3(); break;
      default: stepContent = _buildStep4();
    }

    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Background
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF1A3C1A), Color(0xFF2D5A27), Color(0xFF1A3C1A)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
          ),
          Positioned(
            top: -60, right: -60,
            child: Container(
              width: 200, height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.accentLight.withValues(alpha: 0.08),
              ),
            ),
          ),
          Positioned(
            bottom: -80, left: -80,
            child: Container(
              width: 250, height: 250,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.primary.withValues(alpha: 0.15),
              ),
            ),
          ),

          // Content
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
              child: _card(
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const LakwedhaLogo(size: 64),
                    const SizedBox(height: 12),
                    if (_step < 4) ...[
                      _stepIndicator(),
                      const SizedBox(height: 20),
                      const Divider(height: 1),
                      const SizedBox(height: 16),
                    ],
                    stepContent,
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
