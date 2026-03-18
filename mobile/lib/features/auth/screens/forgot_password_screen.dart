import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../data/datasources/remote/api_service.dart';
import '../widgets/auth_button.dart';
import '../widgets/custom_text_field.dart';

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────
enum _Method { email, phone }
enum _Step   { send, verify, reset, success }

// ─────────────────────────────────────────────────────────────────────────────
//  ForgotPasswordScreen
// ─────────────────────────────────────────────────────────────────────────────
class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _apiService = ApiService();

  _Step   _step   = _Step.send;
  _Method _method = _Method.email;

  final _valueCtrl   = TextEditingController();
  final _otpCtrl     = TextEditingController();
  final _pwCtrl      = TextEditingController();
  final _confirmCtrl = TextEditingController();

  String  _maskedValue  = '';
  String  _resetToken   = '';
  String? _error;
  bool    _loading      = false;
  bool    _showPw       = false;
  bool    _showConfirm  = false;

  Timer? _expiryTimer;
  Timer? _resendTimer;
  int    _expirySeconds  = 0;
  int    _resendCooldown = 0;

  @override
  void initState() {
    super.initState();
    // Rebuild on password input so strength/match updates live
    _pwCtrl.addListener(() => setState(() {}));
    _confirmCtrl.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _valueCtrl.dispose();
    _otpCtrl.dispose();
    _pwCtrl.dispose();
    _confirmCtrl.dispose();
    _expiryTimer?.cancel();
    _resendTimer?.cancel();
    super.dispose();
  }

  // ── Timers ──────────────────────────────────────────────────────────────────

  void _startExpiryTimer() {
    _expiryTimer?.cancel();
    setState(() => _expirySeconds = 30 * 60);
    _expiryTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() { if (_expirySeconds > 0) _expirySeconds--; });
    });
  }

  void _startResendCooldown([int seconds = 60]) {
    _resendTimer?.cancel();
    setState(() => _resendCooldown = seconds);
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() { if (_resendCooldown > 0) _resendCooldown--; });
    });
  }

  String get _expiryLabel {
    final m = (_expirySeconds ~/ 60).toString().padLeft(2, '0');
    final s = (_expirySeconds  % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  // ── Password strength ────────────────────────────────────────────────────────

  int _pwStrength(String pw) {
    int score = 0;
    if (pw.length >= 8)                                                            score++;
    if (RegExp(r'[A-Z]').hasMatch(pw))                                             score++;
    if (RegExp(r'[0-9]').hasMatch(pw))                                             score++;
    if (RegExp(r'[!@#\$%^&*()_+\-=\[\]{};:"\\|,.<>/?]').hasMatch(pw)) score++;
    return score;
  }

  Color _strengthColor(int s) {
    if (s <= 1) return Colors.red;
    if (s == 2) return Colors.orange;
    if (s == 3) return Colors.yellow.shade700;
    return Colors.green;
  }

  String _strengthLabel(int s) {
    if (s <= 1) return 'Weak';
    if (s == 2) return 'Fair';
    if (s == 3) return 'Good';
    return 'Strong';
  }

  // ── API calls ────────────────────────────────────────────────────────────────

  Future<void> _sendOtp() async {
    final value = _valueCtrl.text.trim();
    if (value.isEmpty) {
      setState(() => _error =
          'Please enter your ${_method == _Method.email ? "email address" : "mobile number"}.');
      return;
    }
    if (_method == _Method.email &&
        !RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(value)) {
      setState(() => _error = 'Please enter a valid email address.');
      return;
    }

    setState(() { _loading = true; _error = null; });
    try {
      final res = await _apiService.forgotPasswordSendOtp(
        method: _method == _Method.email ? 'email' : 'phone',
        value: value,
      );
      _maskedValue = res['maskedValue'] as String? ?? value;
      _otpCtrl.clear();
      _startExpiryTimer();
      _startResendCooldown();
      setState(() => _step = _Step.verify);
    } on ForgotPasswordException catch (e) {
      if (e.waitSeconds != null) _startResendCooldown(e.waitSeconds!);
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = AppStrings.networkError);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _verifyOtp() async {
    if (_otpCtrl.text.trim().length < 5) {
      setState(() => _error = 'Please enter the complete 5-digit OTP.');
      return;
    }
    if (_expirySeconds == 0) {
      setState(() => _error = 'OTP has expired. Please request a new one.');
      return;
    }

    setState(() { _loading = true; _error = null; });
    try {
      final res = await _apiService.forgotPasswordVerifyOtp(
        method: _method == _Method.email ? 'email' : 'phone',
        value: _valueCtrl.text.trim(),
        otp: _otpCtrl.text.trim(),
      );
      _resetToken = res['resetToken'] as String? ?? '';
      _expiryTimer?.cancel();
      _resendTimer?.cancel();
      _pwCtrl.clear();
      _confirmCtrl.clear();
      setState(() => _step = _Step.reset);
    } on ForgotPasswordException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = AppStrings.networkError);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _resetPassword() async {
    final pw      = _pwCtrl.text;
    final confirm = _confirmCtrl.text;
    if (_pwStrength(pw) < 4) {
      setState(() => _error =
          'Password must be 8+ chars with uppercase, number, and symbol.');
      return;
    }
    if (pw != confirm) {
      setState(() => _error = 'Passwords do not match.');
      return;
    }

    setState(() { _loading = true; _error = null; });
    try {
      await _apiService.forgotPasswordReset(
          resetToken: _resetToken, newPassword: pw);
      setState(() => _step = _Step.success);
    } on ForgotPasswordException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = AppStrings.networkError);
    } finally {
      setState(() => _loading = false);
    }
  }

  // ── Root scaffold ────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
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
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
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
                  child: _buildStep(),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStep() {
    switch (_step) {
      case _Step.send:    return _buildSend();
      case _Step.verify:  return _buildVerify();
      case _Step.reset:   return _buildReset();
      case _Step.success: return _buildSuccess();
    }
  }

  // ─── Step 1: Send OTP ────────────────────────────────────────────────────────

  Widget _buildSend() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        _logo(),
        const SizedBox(height: 16),
        Text(
          AppStrings.forgotPasswordTitle,
          style: GoogleFonts.playfairDisplay(
            fontSize: 26, fontWeight: FontWeight.bold, color: AppColors.textDark,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Choose how to receive your one-time password.',
          textAlign: TextAlign.center,
          style: GoogleFonts.inter(fontSize: 13, color: AppColors.textMedium),
        ),
        const SizedBox(height: 24),
        Row(
          children: [
            Expanded(child: _methodBtn(_Method.email, Icons.email_outlined, 'Email')),
            const SizedBox(width: 10),
            Expanded(child: _methodBtn(_Method.phone, Icons.phone_outlined, 'Mobile')),
          ],
        ),
        const SizedBox(height: 16),
        CustomTextField(
          label: _method == _Method.email ? AppStrings.emailLabel : 'Mobile Number',
          hint:  _method == _Method.email ? AppStrings.emailHint  : '+94 7X XXX XXXX',
          controller: _valueCtrl,
          keyboardType: _method == _Method.email
              ? TextInputType.emailAddress
              : TextInputType.phone,
          validator: (_) => null,
        ),
        if (_error != null) ...[
          const SizedBox(height: 12),
          _errorBox(_error!),
        ],
        const SizedBox(height: 20),
        AuthButton(
          label: 'Send OTP',
          isLoading: _loading,
          onPressed: _sendOtp,
        ),
        const SizedBox(height: 14),
        TextButton.icon(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.arrow_back_ios_new_rounded,
              size: 14, color: AppColors.primary),
          label: Text(
            AppStrings.backToSignIn,
            style: GoogleFonts.inter(
              fontSize: 13, color: AppColors.primary, fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }

  Widget _methodBtn(_Method m, IconData icon, String label) {
    final selected = _method == m;
    return GestureDetector(
      onTap: () => setState(() { _method = m; _valueCtrl.clear(); _error = null; }),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.primary.withValues(alpha: 0.12)
              : Colors.transparent,
          border: Border.all(
            color: selected ? AppColors.primary : Colors.grey.shade400,
            width: selected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 16,
                color: selected ? AppColors.primary : AppColors.textMedium),
            const SizedBox(width: 6),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                color: selected ? AppColors.primary : AppColors.textMedium,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Step 2: Verify OTP ──────────────────────────────────────────────────────

  Widget _buildVerify() {
    final expired  = _expirySeconds == 0;
    final otpReady = _otpCtrl.text.trim().length >= 5;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          children: [
            IconButton(
              onPressed: () => setState(() { _step = _Step.send; _error = null; }),
              icon: const Icon(Icons.arrow_back_ios_new_rounded,
                  size: 18, color: AppColors.primary),
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Verify OTP',
                    style: GoogleFonts.playfairDisplay(
                      fontSize: 22, fontWeight: FontWeight.bold,
                      color: AppColors.textDark,
                    ),
                  ),
                  Text(
                    'Sent to $_maskedValue',
                    style: GoogleFonts.inter(
                        fontSize: 12, color: AppColors.textMedium),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Expiry banner
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 14),
          decoration: BoxDecoration(
            color: expired
                ? AppColors.error.withValues(alpha: 0.08)
                : AppColors.success.withValues(alpha: 0.08),
            border: Border.all(
              color: expired
                  ? AppColors.error.withValues(alpha: 0.40)
                  : AppColors.success.withValues(alpha: 0.35),
            ),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                expired
                    ? Icons.timer_off_outlined
                    : Icons.timer_outlined,
                size: 15,
                color: expired ? AppColors.error : AppColors.success,
              ),
              const SizedBox(width: 6),
              Text(
                expired
                    ? 'OTP expired — request a new one'
                    : 'Expires in $_expiryLabel',
                style: GoogleFonts.inter(
                  fontSize: 13, fontWeight: FontWeight.w600,
                  color: expired ? AppColors.error : AppColors.success,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // OTP boxes
        _OtpBoxes(
          onChanged: (v) => setState(() { _otpCtrl.text = v; _error = null; }),
          enabled: !expired && !_loading,
        ),

        // Clipboard hint
        _ClipboardHintButton(
          enabled: !expired && !_loading,
          onPaste: (code) => setState(() { _otpCtrl.text = code; _error = null; }),
        ),

        if (_error != null) ...[
          const SizedBox(height: 10),
          _errorBox(_error!),
        ],
        const SizedBox(height: 20),

        // Verify button — disabled visually when not ready
        Opacity(
          opacity: (expired || !otpReady) ? 0.5 : 1.0,
          child: IgnorePointer(
            ignoring: expired || !otpReady,
            child: AuthButton(
              label: 'Verify OTP',
              isLoading: _loading,
              onPressed: _verifyOtp,
            ),
          ),
        ),
        const SizedBox(height: 14),

        // Resend
        TextButton.icon(
          onPressed: (_resendCooldown > 0 || _loading) ? null : _sendOtp,
          icon: Icon(Icons.refresh_rounded, size: 15,
              color: _resendCooldown > 0
                  ? AppColors.textLight
                  : AppColors.primary),
          label: Text(
            _resendCooldown > 0
                ? 'Resend OTP in ${_resendCooldown}s'
                : 'Resend OTP',
            style: GoogleFonts.inter(
              fontSize: 13,
              color: _resendCooldown > 0
                  ? AppColors.textLight
                  : AppColors.primary,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        TextButton(
          onPressed: () =>
              setState(() { _step = _Step.send; _error = null; }),
          child: Text(
            'Change recovery method',
            style: GoogleFonts.inter(
                fontSize: 12, color: AppColors.textLight),
          ),
        ),
      ],
    );
  }

  // ─── Step 3: Reset Password ──────────────────────────────────────────────────

  Widget _buildReset() {
    final strength = _pwStrength(_pwCtrl.text);
    final pwMatch  = _pwCtrl.text.isNotEmpty &&
        _confirmCtrl.text.isNotEmpty &&
        _pwCtrl.text == _confirmCtrl.text;
    final canSubmit = strength >= 4 && pwMatch;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        _logo(),
        const SizedBox(height: 16),
        Text(
          'New Password',
          style: GoogleFonts.playfairDisplay(
            fontSize: 26, fontWeight: FontWeight.bold, color: AppColors.textDark,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Choose a strong password for your account.',
          textAlign: TextAlign.center,
          style: GoogleFonts.inter(fontSize: 13, color: AppColors.textMedium),
        ),
        const SizedBox(height: 24),

        // New password field (built inline to support suffixIcon)
        _pwField(
          label: 'New Password',
          hint: 'Min 8 chars, A-Z, 0-9, symbol',
          controller: _pwCtrl,
          obscure: !_showPw,
          toggle: () => setState(() => _showPw = !_showPw),
        ),

        // Strength meter
        if (_pwCtrl.text.isNotEmpty) ...[
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: strength / 4,
                    minHeight: 6,
                    backgroundColor: Colors.grey.shade200,
                    valueColor: AlwaysStoppedAnimation<Color>(
                        _strengthColor(strength)),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                _strengthLabel(strength),
                style: GoogleFonts.inter(
                  fontSize: 11, fontWeight: FontWeight.w600,
                  color: _strengthColor(strength),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ..._requirements(_pwCtrl.text),
        ],

        const SizedBox(height: 14),

        // Confirm password field
        _pwField(
          label: 'Confirm Password',
          hint: 'Re-enter your password',
          controller: _confirmCtrl,
          obscure: !_showConfirm,
          toggle: () => setState(() => _showConfirm = !_showConfirm),
        ),

        if (_confirmCtrl.text.isNotEmpty) ...[
          const SizedBox(height: 6),
          Row(
            children: [
              Icon(
                pwMatch
                    ? Icons.check_circle_outline
                    : Icons.cancel_outlined,
                size: 14,
                color: pwMatch ? AppColors.success : AppColors.error,
              ),
              const SizedBox(width: 4),
              Text(
                pwMatch ? 'Passwords match' : 'Passwords do not match',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  color: pwMatch ? AppColors.success : AppColors.error,
                ),
              ),
            ],
          ),
        ],

        if (_error != null) ...[
          const SizedBox(height: 12),
          _errorBox(_error!),
        ],
        const SizedBox(height: 20),

        Opacity(
          opacity: canSubmit ? 1.0 : 0.5,
          child: IgnorePointer(
            ignoring: !canSubmit,
            child: AuthButton(
              label: 'Reset Password',
              isLoading: _loading,
              onPressed: _resetPassword,
            ),
          ),
        ),
      ],
    );
  }

  /// Inline password field that supports suffixIcon and onChange via listener.
  Widget _pwField({
    required String label,
    required String hint,
    required TextEditingController controller,
    required bool obscure,
    required VoidCallback toggle,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: AppColors.textDark)),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          obscureText: obscure,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(
                color: AppColors.textLight, fontSize: 14),
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
              borderSide: const BorderSide(
                  color: AppColors.accent, width: 2),
            ),
            contentPadding: const EdgeInsets.symmetric(
                horizontal: 16, vertical: 12),
            suffixIcon: IconButton(
              icon: Icon(
                obscure
                    ? Icons.visibility_outlined
                    : Icons.visibility_off_outlined,
                size: 20,
                color: AppColors.textLight,
              ),
              onPressed: toggle,
            ),
          ),
        ),
      ],
    );
  }

  List<Widget> _requirements(String pw) {
    final reqs = [
      ('At least 8 characters',         pw.length >= 8),
      ('One uppercase letter (A–Z)',     RegExp(r'[A-Z]').hasMatch(pw)),
      ('One number (0–9)',               RegExp(r'[0-9]').hasMatch(pw)),
      ('One special character (!@#…)',
          RegExp(r'[!@#\$%^&*()_+\-=\[\]{};:"\\|,.<>/?]').hasMatch(pw)),
    ];
    return reqs.map((r) => Padding(
      padding: const EdgeInsets.only(bottom: 3),
      child: Row(
        children: [
          Icon(
            r.$2
                ? Icons.check_circle_outline
                : Icons.radio_button_unchecked,
            size: 13,
            color: r.$2 ? AppColors.success : AppColors.textLight,
          ),
          const SizedBox(width: 6),
          Text(r.$1,
              style: GoogleFonts.inter(
                fontSize: 11,
                color: r.$2 ? AppColors.success : AppColors.textLight,
              )),
        ],
      ),
    )).toList();
  }

  // ─── Step 4: Success ─────────────────────────────────────────────────────────

  Widget _buildSuccess() {
    return Column(
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
          child: const Icon(
            Icons.check_circle_outline_rounded,
            size: 40, color: AppColors.success,
          ),
        ),
        const SizedBox(height: 20),
        Text(
          'Password Reset!',
          style: GoogleFonts.playfairDisplay(
            fontSize: 26, fontWeight: FontWeight.bold,
            color: AppColors.textDark,
          ),
        ),
        const SizedBox(height: 10),
        Text(
          'Your password has been successfully reset.',
          textAlign: TextAlign.center,
          style: GoogleFonts.inter(fontSize: 13, color: AppColors.textMedium),
        ),
        const SizedBox(height: 6),
        Text(
          'All existing sessions have been signed out for your security.',
          textAlign: TextAlign.center,
          style: GoogleFonts.inter(fontSize: 12, color: AppColors.textLight),
        ),
        const SizedBox(height: 28),
        AuthButton(
          label: AppStrings.backToSignIn,
          onPressed: () =>
              Navigator.pushReplacementNamed(context, '/sign-in'),
        ),
      ],
    );
  }

  // ─── Shared helpers ──────────────────────────────────────────────────────────

  Widget _logo() => Container(
    width: 70, height: 70,
    decoration: BoxDecoration(
      color: AppColors.primaryDark,
      shape: BoxShape.circle,
      border: Border.all(color: AppColors.accent, width: 2.5),
    ),
    child: const Icon(
      Icons.lock_reset_outlined, size: 32, color: AppColors.accentLight,
    ),
  );

  Widget _errorBox(String msg) => Container(
    width: double.infinity,
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
    decoration: BoxDecoration(
      color: AppColors.error.withValues(alpha: 0.08),
      border:
          Border.all(color: AppColors.error.withValues(alpha: 0.40)),
      borderRadius: BorderRadius.circular(10),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Icon(Icons.warning_amber_rounded,
            size: 16, color: AppColors.error),
        const SizedBox(width: 8),
        Expanded(
          child: Text(msg,
              style:
                  GoogleFonts.inter(fontSize: 12, color: AppColors.error)),
        ),
      ],
    ),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  5-box OTP input widget
// ─────────────────────────────────────────────────────────────────────────────
class _OtpBoxes extends StatefulWidget {
  final ValueChanged<String> onChanged;
  final bool enabled;
  const _OtpBoxes({required this.onChanged, this.enabled = true});

  @override
  State<_OtpBoxes> createState() => _OtpBoxesState();
}

class _OtpBoxesState extends State<_OtpBoxes> {
  final _controllers = List.generate(5, (_) => TextEditingController());
  final _focusNodes   = List.generate(5, (_) => FocusNode());

  @override
  void dispose() {
    for (final c in _controllers) { c.dispose(); }
    for (final f in _focusNodes)  { f.dispose(); }
    super.dispose();
  }

  String get _fullOtp =>
      _controllers.map((c) => c.text).join();

  void _onType(int i, String val) {
    final digits = val.replaceAll(RegExp(r'\D'), '');

    // Handle paste of full 5-digit code
    if (digits.length == 5) {
      for (int j = 0; j < 5; j++) {
        _controllers[j].text = digits[j];
      }
      _focusNodes[4].requestFocus();
      widget.onChanged(_fullOtp);
      setState(() {});
      return;
    }

    final char = digits.isEmpty ? '' : digits[digits.length - 1];
    _controllers[i].text = char;
    _controllers[i].selection = TextSelection.fromPosition(
        TextPosition(offset: char.length));
    if (char.isNotEmpty && i < 4) _focusNodes[i + 1].requestFocus();
    widget.onChanged(_fullOtp);
    setState(() {});
  }

  void _onBackspace(int i) {
    if (_controllers[i].text.isEmpty && i > 0) {
      _controllers[i - 1].clear();
      _focusNodes[i - 1].requestFocus();
    } else {
      _controllers[i].clear();
    }
    widget.onChanged(_fullOtp);
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(5, (i) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 5),
        child: SizedBox(
          width: 48, height: 56,
          child: KeyboardListener(
            focusNode: FocusNode(canRequestFocus: false),
            onKeyEvent: (event) {
              if (event is KeyDownEvent &&
                  event.logicalKey == LogicalKeyboardKey.backspace) {
                _onBackspace(i);
              }
            },
            child: TextFormField(
              controller: _controllers[i],
              focusNode: _focusNodes[i],
              enabled: widget.enabled,
              textAlign: TextAlign.center,
              keyboardType: TextInputType.number,
              maxLength: 1,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              onChanged: (v) => _onType(i, v),
              decoration: InputDecoration(
                counterText: '',
                filled: true,
                fillColor: widget.enabled
                    ? (_controllers[i].text.isNotEmpty
                        ? const Color(0xFFECFDF5)
                        : Colors.white)
                    : Colors.grey.shade100,
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(
                    color: _controllers[i].text.isNotEmpty
                        ? AppColors.success
                        : Colors.grey.shade300,
                    width: _controllers[i].text.isNotEmpty ? 2 : 1,
                  ),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(
                      color: AppColors.primary, width: 2),
                ),
                disabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade200),
                ),
              ),
              style: GoogleFonts.inter(
                fontSize: 22, fontWeight: FontWeight.bold,
                color: AppColors.textDark,
              ),
            ),
          ),
        ),
      )),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Clipboard OTP paste hint
// ─────────────────────────────────────────────────────────────────────────────
class _ClipboardHintButton extends StatefulWidget {
  final bool enabled;
  final ValueChanged<String> onPaste;
  const _ClipboardHintButton(
      {required this.enabled, required this.onPaste});

  @override
  State<_ClipboardHintButton> createState() =>
      _ClipboardHintButtonState();
}

class _ClipboardHintButtonState extends State<_ClipboardHintButton> {
  bool _hasCode = false;

  @override
  void initState() {
    super.initState();
    _check();
  }

  Future<void> _check() async {
    try {
      final data = await Clipboard.getData('text/plain');
      final text = data?.text?.trim() ?? '';
      if (mounted && RegExp(r'^\d{5}$').hasMatch(text)) {
        setState(() => _hasCode = true);
      }
    } catch (_) {}
  }

  Future<void> _paste() async {
    try {
      final data = await Clipboard.getData('text/plain');
      final code = data?.text?.trim() ?? '';
      if (RegExp(r'^\d{5}$').hasMatch(code)) {
        widget.onPaste(code);
        setState(() => _hasCode = false);
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    if (!_hasCode || !widget.enabled) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: TextButton.icon(
        onPressed: _paste,
        icon: const Icon(Icons.content_paste_rounded, size: 15),
        label: Text(
          'Paste OTP from clipboard',
          style: GoogleFonts.inter(
              fontSize: 12, fontWeight: FontWeight.w600),
        ),
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primary,
          backgroundColor: AppColors.primary.withValues(alpha: 0.08),
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8)),
          padding: const EdgeInsets.symmetric(
              horizontal: 14, vertical: 8),
        ),
      ),
    );
  }
}
