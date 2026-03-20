import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/services/auth_service.dart';
import '../../../presentation/widgets/lakwedha_logo.dart';

/* ── Countries: name, nationality label, ISO-2, dial code ───────────── */
const List<Map<String, String>> _kCountries = [
  {'name': 'Sri Lanka',              'nat': 'Sri Lankan',     'code': 'LK', 'dial': '+94'},
  {'name': 'Afghanistan',            'nat': 'Afghan',         'code': 'AF', 'dial': '+93'},
  {'name': 'Albania',                'nat': 'Albanian',       'code': 'AL', 'dial': '+355'},
  {'name': 'Algeria',                'nat': 'Algerian',       'code': 'DZ', 'dial': '+213'},
  {'name': 'Angola',                 'nat': 'Angolan',        'code': 'AO', 'dial': '+244'},
  {'name': 'Argentina',              'nat': 'Argentine',      'code': 'AR', 'dial': '+54'},
  {'name': 'Armenia',                'nat': 'Armenian',       'code': 'AM', 'dial': '+374'},
  {'name': 'Australia',              'nat': 'Australian',     'code': 'AU', 'dial': '+61'},
  {'name': 'Austria',                'nat': 'Austrian',       'code': 'AT', 'dial': '+43'},
  {'name': 'Azerbaijan',             'nat': 'Azerbaijani',    'code': 'AZ', 'dial': '+994'},
  {'name': 'Bahrain',                'nat': 'Bahraini',       'code': 'BH', 'dial': '+973'},
  {'name': 'Bangladesh',             'nat': 'Bangladeshi',    'code': 'BD', 'dial': '+880'},
  {'name': 'Belarus',                'nat': 'Belarusian',     'code': 'BY', 'dial': '+375'},
  {'name': 'Belgium',                'nat': 'Belgian',        'code': 'BE', 'dial': '+32'},
  {'name': 'Bolivia',                'nat': 'Bolivian',       'code': 'BO', 'dial': '+591'},
  {'name': 'Bosnia and Herzegovina', 'nat': 'Bosnian',        'code': 'BA', 'dial': '+387'},
  {'name': 'Botswana',               'nat': 'Motswana',       'code': 'BW', 'dial': '+267'},
  {'name': 'Brazil',                 'nat': 'Brazilian',      'code': 'BR', 'dial': '+55'},
  {'name': 'Brunei',                 'nat': 'Bruneian',       'code': 'BN', 'dial': '+673'},
  {'name': 'Bulgaria',               'nat': 'Bulgarian',      'code': 'BG', 'dial': '+359'},
  {'name': 'Cambodia',               'nat': 'Cambodian',      'code': 'KH', 'dial': '+855'},
  {'name': 'Cameroon',               'nat': 'Cameroonian',    'code': 'CM', 'dial': '+237'},
  {'name': 'Canada',                 'nat': 'Canadian',       'code': 'CA', 'dial': '+1'},
  {'name': 'Chile',                  'nat': 'Chilean',        'code': 'CL', 'dial': '+56'},
  {'name': 'China',                  'nat': 'Chinese',        'code': 'CN', 'dial': '+86'},
  {'name': 'Colombia',               'nat': 'Colombian',      'code': 'CO', 'dial': '+57'},
  {'name': 'Croatia',                'nat': 'Croatian',       'code': 'HR', 'dial': '+385'},
  {'name': 'Cuba',                   'nat': 'Cuban',          'code': 'CU', 'dial': '+53'},
  {'name': 'Cyprus',                 'nat': 'Cypriot',        'code': 'CY', 'dial': '+357'},
  {'name': 'Czech Republic',         'nat': 'Czech',          'code': 'CZ', 'dial': '+420'},
  {'name': 'Denmark',                'nat': 'Danish',         'code': 'DK', 'dial': '+45'},
  {'name': 'Ecuador',                'nat': 'Ecuadorian',     'code': 'EC', 'dial': '+593'},
  {'name': 'Egypt',                  'nat': 'Egyptian',       'code': 'EG', 'dial': '+20'},
  {'name': 'Ethiopia',               'nat': 'Ethiopian',      'code': 'ET', 'dial': '+251'},
  {'name': 'Finland',                'nat': 'Finnish',        'code': 'FI', 'dial': '+358'},
  {'name': 'France',                 'nat': 'French',         'code': 'FR', 'dial': '+33'},
  {'name': 'Georgia',                'nat': 'Georgian',       'code': 'GE', 'dial': '+995'},
  {'name': 'Germany',                'nat': 'German',         'code': 'DE', 'dial': '+49'},
  {'name': 'Ghana',                  'nat': 'Ghanaian',       'code': 'GH', 'dial': '+233'},
  {'name': 'Greece',                 'nat': 'Greek',          'code': 'GR', 'dial': '+30'},
  {'name': 'Guatemala',              'nat': 'Guatemalan',     'code': 'GT', 'dial': '+502'},
  {'name': 'Hong Kong',              'nat': 'Hong Konger',    'code': 'HK', 'dial': '+852'},
  {'name': 'Hungary',                'nat': 'Hungarian',      'code': 'HU', 'dial': '+36'},
  {'name': 'Iceland',                'nat': 'Icelandic',      'code': 'IS', 'dial': '+354'},
  {'name': 'India',                  'nat': 'Indian',         'code': 'IN', 'dial': '+91'},
  {'name': 'Indonesia',              'nat': 'Indonesian',     'code': 'ID', 'dial': '+62'},
  {'name': 'Iran',                   'nat': 'Iranian',        'code': 'IR', 'dial': '+98'},
  {'name': 'Iraq',                   'nat': 'Iraqi',          'code': 'IQ', 'dial': '+964'},
  {'name': 'Ireland',                'nat': 'Irish',          'code': 'IE', 'dial': '+353'},
  {'name': 'Israel',                 'nat': 'Israeli',        'code': 'IL', 'dial': '+972'},
  {'name': 'Italy',                  'nat': 'Italian',        'code': 'IT', 'dial': '+39'},
  {'name': 'Japan',                  'nat': 'Japanese',       'code': 'JP', 'dial': '+81'},
  {'name': 'Jordan',                 'nat': 'Jordanian',      'code': 'JO', 'dial': '+962'},
  {'name': 'Kazakhstan',             'nat': 'Kazakhstani',    'code': 'KZ', 'dial': '+7'},
  {'name': 'Kenya',                  'nat': 'Kenyan',         'code': 'KE', 'dial': '+254'},
  {'name': 'Kuwait',                 'nat': 'Kuwaiti',        'code': 'KW', 'dial': '+965'},
  {'name': 'Kyrgyzstan',             'nat': 'Kyrgyz',         'code': 'KG', 'dial': '+996'},
  {'name': 'Laos',                   'nat': 'Laotian',        'code': 'LA', 'dial': '+856'},
  {'name': 'Latvia',                 'nat': 'Latvian',        'code': 'LV', 'dial': '+371'},
  {'name': 'Lebanon',                'nat': 'Lebanese',       'code': 'LB', 'dial': '+961'},
  {'name': 'Libya',                  'nat': 'Libyan',         'code': 'LY', 'dial': '+218'},
  {'name': 'Lithuania',              'nat': 'Lithuanian',     'code': 'LT', 'dial': '+370'},
  {'name': 'Luxembourg',             'nat': 'Luxembourger',   'code': 'LU', 'dial': '+352'},
  {'name': 'Malaysia',               'nat': 'Malaysian',      'code': 'MY', 'dial': '+60'},
  {'name': 'Maldives',               'nat': 'Maldivian',      'code': 'MV', 'dial': '+960'},
  {'name': 'Malta',                  'nat': 'Maltese',        'code': 'MT', 'dial': '+356'},
  {'name': 'Mexico',                 'nat': 'Mexican',        'code': 'MX', 'dial': '+52'},
  {'name': 'Moldova',                'nat': 'Moldovan',       'code': 'MD', 'dial': '+373'},
  {'name': 'Mongolia',               'nat': 'Mongolian',      'code': 'MN', 'dial': '+976'},
  {'name': 'Morocco',                'nat': 'Moroccan',       'code': 'MA', 'dial': '+212'},
  {'name': 'Mozambique',             'nat': 'Mozambican',     'code': 'MZ', 'dial': '+258'},
  {'name': 'Myanmar',                'nat': 'Burmese',        'code': 'MM', 'dial': '+95'},
  {'name': 'Nepal',                  'nat': 'Nepali',         'code': 'NP', 'dial': '+977'},
  {'name': 'Netherlands',            'nat': 'Dutch',          'code': 'NL', 'dial': '+31'},
  {'name': 'New Zealand',            'nat': 'New Zealander',  'code': 'NZ', 'dial': '+64'},
  {'name': 'Nigeria',                'nat': 'Nigerian',       'code': 'NG', 'dial': '+234'},
  {'name': 'Norway',                 'nat': 'Norwegian',      'code': 'NO', 'dial': '+47'},
  {'name': 'Oman',                   'nat': 'Omani',          'code': 'OM', 'dial': '+968'},
  {'name': 'Pakistan',               'nat': 'Pakistani',      'code': 'PK', 'dial': '+92'},
  {'name': 'Palestine',              'nat': 'Palestinian',    'code': 'PS', 'dial': '+970'},
  {'name': 'Panama',                 'nat': 'Panamanian',     'code': 'PA', 'dial': '+507'},
  {'name': 'Peru',                   'nat': 'Peruvian',       'code': 'PE', 'dial': '+51'},
  {'name': 'Philippines',            'nat': 'Filipino',       'code': 'PH', 'dial': '+63'},
  {'name': 'Poland',                 'nat': 'Polish',         'code': 'PL', 'dial': '+48'},
  {'name': 'Portugal',               'nat': 'Portuguese',     'code': 'PT', 'dial': '+351'},
  {'name': 'Qatar',                  'nat': 'Qatari',         'code': 'QA', 'dial': '+974'},
  {'name': 'Romania',                'nat': 'Romanian',       'code': 'RO', 'dial': '+40'},
  {'name': 'Russia',                 'nat': 'Russian',        'code': 'RU', 'dial': '+7'},
  {'name': 'Saudi Arabia',           'nat': 'Saudi',          'code': 'SA', 'dial': '+966'},
  {'name': 'Senegal',                'nat': 'Senegalese',     'code': 'SN', 'dial': '+221'},
  {'name': 'Serbia',                 'nat': 'Serbian',        'code': 'RS', 'dial': '+381'},
  {'name': 'Singapore',              'nat': 'Singaporean',    'code': 'SG', 'dial': '+65'},
  {'name': 'Slovakia',               'nat': 'Slovak',         'code': 'SK', 'dial': '+421'},
  {'name': 'Slovenia',               'nat': 'Slovenian',      'code': 'SI', 'dial': '+386'},
  {'name': 'Somalia',                'nat': 'Somali',         'code': 'SO', 'dial': '+252'},
  {'name': 'South Africa',           'nat': 'South African',  'code': 'ZA', 'dial': '+27'},
  {'name': 'South Korea',            'nat': 'South Korean',   'code': 'KR', 'dial': '+82'},
  {'name': 'Spain',                  'nat': 'Spanish',        'code': 'ES', 'dial': '+34'},
  {'name': 'Sudan',                  'nat': 'Sudanese',       'code': 'SD', 'dial': '+249'},
  {'name': 'Sweden',                 'nat': 'Swedish',        'code': 'SE', 'dial': '+46'},
  {'name': 'Switzerland',            'nat': 'Swiss',          'code': 'CH', 'dial': '+41'},
  {'name': 'Syria',                  'nat': 'Syrian',         'code': 'SY', 'dial': '+963'},
  {'name': 'Taiwan',                 'nat': 'Taiwanese',      'code': 'TW', 'dial': '+886'},
  {'name': 'Tajikistan',             'nat': 'Tajik',          'code': 'TJ', 'dial': '+992'},
  {'name': 'Tanzania',               'nat': 'Tanzanian',      'code': 'TZ', 'dial': '+255'},
  {'name': 'Thailand',               'nat': 'Thai',           'code': 'TH', 'dial': '+66'},
  {'name': 'Tunisia',                'nat': 'Tunisian',       'code': 'TN', 'dial': '+216'},
  {'name': 'Turkey',                 'nat': 'Turkish',        'code': 'TR', 'dial': '+90'},
  {'name': 'Turkmenistan',           'nat': 'Turkmen',        'code': 'TM', 'dial': '+993'},
  {'name': 'Uganda',                 'nat': 'Ugandan',        'code': 'UG', 'dial': '+256'},
  {'name': 'Ukraine',                'nat': 'Ukrainian',      'code': 'UA', 'dial': '+380'},
  {'name': 'United Arab Emirates',   'nat': 'Emirati',        'code': 'AE', 'dial': '+971'},
  {'name': 'United Kingdom',         'nat': 'British',        'code': 'GB', 'dial': '+44'},
  {'name': 'United States',          'nat': 'American',       'code': 'US', 'dial': '+1'},
  {'name': 'Uruguay',                'nat': 'Uruguayan',      'code': 'UY', 'dial': '+598'},
  {'name': 'Uzbekistan',             'nat': 'Uzbek',          'code': 'UZ', 'dial': '+998'},
  {'name': 'Venezuela',              'nat': 'Venezuelan',     'code': 'VE', 'dial': '+58'},
  {'name': 'Vietnam',                'nat': 'Vietnamese',     'code': 'VN', 'dial': '+84'},
  {'name': 'Yemen',                  'nat': 'Yemeni',         'code': 'YE', 'dial': '+967'},
  {'name': 'Zimbabwe',               'nat': 'Zimbabwean',     'code': 'ZW', 'dial': '+263'},
];

/// ISO-2 code → flag emoji  e.g. "LK" → 🇱🇰
String _flag(String iso) => String.fromCharCodes(
      iso.toUpperCase().codeUnits.map((c) => c + 127397));

/// Shared input decoration matching existing CustomTextField style.
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

/* ══════════════════════════════════════════════════════════════════════
   SIGN UP SCREEN
══════════════════════════════════════════════════════════════════════ */
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

  // ─ Step 1 ──────────────────────────────────────────────────────────────
  String _nationality = 'Sri Lankan';
  final  _firstNameCtrl = TextEditingController();
  final  _lastNameCtrl  = TextEditingController();
  String _countryDial   = '+94';
  final  _phoneCtrl     = TextEditingController();

  // ─ Step 2 ──────────────────────────────────────────────────────────────
  final List<TextEditingController> _otpCtrl  =
      List.generate(5, (_) => TextEditingController());
  final List<FocusNode> _otpFocus = List.generate(5, (_) => FocusNode());
  String _maskedPhone    = '';
  int    _expirySecs     = 0;
  Timer? _expiryTimer;
  int    _resendCooldown = 0;
  Timer? _resendTimer;
  String _verifyToken    = '';

  // ─ Step 3 ──────────────────────────────────────────────────────────────
  String    _title    = 'Mr';
  final     _emailCtrl = TextEditingController();
  DateTime? _birthday;
  String    _nicType  = 'NIC';
  final     _nicCtrl  = TextEditingController();
  final     _pwCtrl   = TextEditingController();
  final     _cpwCtrl  = TextEditingController();
  bool      _showPw   = false;
  bool      _showCpw  = false;

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _phoneCtrl.dispose();
    for (final c in _otpCtrl) c.dispose();
    for (final f in _otpFocus) f.dispose();
    _emailCtrl.dispose();
    _nicCtrl.dispose();
    _pwCtrl.dispose();
    _cpwCtrl.dispose();
    _expiryTimer?.cancel();
    _resendTimer?.cancel();
    super.dispose();
  }

  String get _otpValue => _otpCtrl.map((c) => c.text).join();

  /* ── Timers ──────────────────────────────────────────────────────────── */

  void _startExpiryTimer() {
    _expiryTimer?.cancel();
    setState(() => _expirySecs = 1800);
    _expiryTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() {
        if (_expirySecs > 0) _expirySecs--;
        else _expiryTimer?.cancel();
      });
    });
  }

  void _startResendCooldown() {
    setState(() => _resendCooldown = 60);
    _resendTimer?.cancel();
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() {
        if (_resendCooldown > 0) _resendCooldown--;
        else _resendTimer?.cancel();
      });
    });
  }

  String _fmt(int s) =>
      '${(s ~/ 60).toString().padLeft(2, '0')}:${(s % 60).toString().padLeft(2, '0')}';

  /* ── Password helpers ────────────────────────────────────────────────── */

  int _pwStrength(String pw) {
    int score = 0;
    if (pw.length >= 8) score++;
    if (RegExp(r'[A-Z]').hasMatch(pw)) score++;
    if (RegExp(r'[0-9]').hasMatch(pw)) score++;
    if (RegExp(r'[!@#$%^&*()\-_=+\[\]{};:",.<>/?]').hasMatch(pw)) score++;
    return score;
  }

  Color _pwColor(int s) {
    if (s <= 1) return Colors.red;
    if (s == 2) return Colors.orange;
    if (s == 3) return Colors.yellow.shade700;
    return Colors.green;
  }

  String _pwLabel(int s) {
    switch (s) {
      case 0: return 'Too short';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      default: return 'Strong';
    }
  }

  /* ── API calls ───────────────────────────────────────────────────────── */

  Future<void> _sendOtp() async {
    final errs = <String, String>{};
    if (_firstNameCtrl.text.trim().isEmpty) errs['firstName'] = 'First name is required.';
    if (_lastNameCtrl.text.trim().isEmpty)  errs['lastName']  = 'Last name is required.';
    final p = _phoneCtrl.text.trim();
    if (p.isEmpty) {
      errs['phone'] = 'Mobile number is required.';
    } else if (!RegExp(r'^\d{5,15}$').hasMatch(p)) {
      errs['phone'] = 'Enter a valid mobile number (5–15 digits).';
    }
    if (errs.isNotEmpty) {
      setState(() { _fieldErrors.addAll(errs); _error = ''; });
      return;
    }
    setState(() { _fieldErrors.clear(); _error = ''; _isLoading = true; });
    try {
      final data = await AuthService.sendRegistrationOtp(
        phone: _phoneCtrl.text.trim(),
        countryCode: _countryDial,
      );
      _maskedPhone = data['maskedPhone'] as String? ?? '';
      for (final c in _otpCtrl) c.clear();
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
      final token = await AuthService.verifyRegistrationOtp(
        phone: _phoneCtrl.text.trim(),
        countryCode: _countryDial,
        otp: _otpValue,
      );
      _verifyToken = token;
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
        phone: _phoneCtrl.text.trim(),
        countryCode: _countryDial,
      );
      _maskedPhone = data['maskedPhone'] as String? ?? '';
      for (final c in _otpCtrl) c.clear();
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
      errs['password'] = 'Password does not meet all requirements below.';
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
        title: _title,
        firstName: _firstNameCtrl.text.trim(),
        lastName:  _lastNameCtrl.text.trim(),
        nationality: _nationality,
        phone: _phoneCtrl.text.trim(),
        countryCode: _countryDial,
        email: email,
        birthday: bStr,
        nicType: _nicType,
        nicNumber: _nicCtrl.text.trim(),
        password: pw,
      );
      setState(() => _step = 4);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  /* ══════════════════════════════════════════════════════════════════════
     UI HELPERS
  ══════════════════════════════════════════════════════════════════════ */

  /// Labeled field wrapper with optional inline error text.
  Widget _field({
    required String label,
    required Widget child,
    String? error,
    EdgeInsets padding = const EdgeInsets.only(bottom: 12),
  }) {
    return Padding(
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
  }

  Widget _buildStepIndicator() {
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
              width: 30,
              height: 30,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: (done || active) ? AppColors.accent : Colors.grey.shade300,
              ),
              child: Center(
                child: done
                    ? const Icon(Icons.check, size: 15, color: Colors.white)
                    : Text('$n',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
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
              width: 28,
              height: 2,
              margin: const EdgeInsets.only(bottom: 14),
              color: n < _step ? AppColors.accent : Colors.grey.shade300,
            ),
        ]);
      }),
    );
  }

  Widget _buildErrorBox() {
    if (_error.isEmpty) return const SizedBox();
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.red.shade200),
      ),
      child: Text(_error,
          style: TextStyle(fontSize: 13, color: Colors.red.shade700)),
    );
  }

  Widget _buildOtpBoxes() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(5, (i) {
        final filled = _otpCtrl[i].text.isNotEmpty;
        return Container(
          width: 52,
          height: 60,
          margin: const EdgeInsets.symmetric(horizontal: 4),
          child: TextField(
            controller: _otpCtrl[i],
            focusNode: _otpFocus[i],
            textAlign: TextAlign.center,
            keyboardType: TextInputType.number,
            maxLength: 1,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            style: GoogleFonts.inter(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: AppColors.textDark,
            ),
            decoration: InputDecoration(
              counterText: '',
              filled: true,
              fillColor: filled
                  ? AppColors.accent.withOpacity(0.08)
                  : AppColors.textFieldBg,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.border),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(
                    color: filled ? AppColors.accent : AppColors.border),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.accent, width: 2),
              ),
            ),
            onChanged: (val) {
              if (val.isNotEmpty) {
                if (i < 4) _otpFocus[i + 1].requestFocus();
              } else {
                if (i > 0) _otpFocus[i - 1].requestFocus();
              }
              setState(() {});
            },
          ),
        );
      }),
    );
  }

  /* ══════════════════════════════════════════════════════════════════════
     STEP 1 – BASIC DETAILS
  ══════════════════════════════════════════════════════════════════════ */
  Widget _buildStep1() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Basic Details',
            style: GoogleFonts.playfairDisplay(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: AppColors.textDark)),
        const SizedBox(height: 4),
        Text('Tell us about yourself to get started.',
            style: GoogleFonts.inter(
                fontSize: 12, color: AppColors.textMedium)),
        const SizedBox(height: 16),

        _buildErrorBox(),

        // Nationality
        _field(
          label: 'Nationality',
          child: DropdownButtonFormField<String>(
            value: _nationality,
            isExpanded: true,
            decoration: _inputDeco('').copyWith(
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            ),
            items: _kCountries
                .map((c) => DropdownMenuItem(
                      value: c['nat'],
                      child: Text(c['nat']!,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontSize: 14, color: AppColors.textDark)),
                    ))
                .toList(),
            onChanged: (v) => setState(() => _nationality = v!),
          ),
        ),

        // First / Last name
        Row(children: [
          Expanded(
            child: _field(
              label: 'First Name',
              error: _fieldErrors['firstName'],
              child: TextFormField(
                controller: _firstNameCtrl,
                decoration: _inputDeco('Avishka'),
                style: const TextStyle(
                    fontSize: 14, color: AppColors.textDark),
                onChanged: (_) =>
                    setState(() => _fieldErrors.remove('firstName')),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _field(
              label: 'Last Name',
              error: _fieldErrors['lastName'],
              child: TextFormField(
                controller: _lastNameCtrl,
                decoration: _inputDeco('Madushan'),
                style: const TextStyle(
                    fontSize: 14, color: AppColors.textDark),
                onChanged: (_) =>
                    setState(() => _fieldErrors.remove('lastName')),
              ),
            ),
          ),
        ]),

        // Country code + phone
        _field(
          label: 'Mobile Number',
          error: _fieldErrors['phone'],
          child: Row(children: [
            // Country code picker
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
                          child: Text(
                            '${_flag(c['code']!)} ${c['dial']}',
                            style: const TextStyle(
                                fontSize: 13,
                                color: AppColors.textDark),
                          ),
                        ))
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
                style: const TextStyle(
                    fontSize: 14, color: AppColors.textDark),
                onChanged: (_) =>
                    setState(() => _fieldErrors.remove('phone')),
              ),
            ),
          ]),
        ),

        const SizedBox(height: 4),

        // Continue button
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _sendOtp,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.accent,
              disabledBackgroundColor: AppColors.accent.withOpacity(0.5),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8)),
            ),
            child: _isLoading
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor:
                            AlwaysStoppedAnimation<Color>(Colors.white)))
                : Text('Continue',
                    style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.white)),
          ),
        ),

        const SizedBox(height: 16),
        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          Text('Already have an account?  ',
              style: GoogleFonts.inter(
                  fontSize: 13, color: AppColors.textMedium)),
          GestureDetector(
            onTap: () =>
                Navigator.pushReplacementNamed(context, '/sign-in'),
            child: Text('Sign In',
                style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppColors.accent,
                    decoration: TextDecoration.underline,
                    decorationColor: AppColors.accent)),
          ),
        ]),
      ],
    );
  }

  /* ══════════════════════════════════════════════════════════════════════
     STEP 2 – OTP VERIFICATION
  ══════════════════════════════════════════════════════════════════════ */
  Widget _buildStep2() {
    final expired = _expirySecs == 0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header with back arrow
        Row(children: [
          GestureDetector(
            onTap: () => setState(() { _step = 1; _error = ''; }),
            child: const Icon(Icons.arrow_back_ios,
                size: 18, color: AppColors.textMedium),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Verify Number',
                      style: GoogleFonts.playfairDisplay(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textDark)),
                  Text(
                      'OTP sent to $_countryDial ******$_maskedPhone',
                      style: GoogleFonts.inter(
                          fontSize: 12, color: AppColors.textMedium)),
                ]),
          ),
        ]),
        const SizedBox(height: 16),

        _buildErrorBox(),

        // OTP expiry banner
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: expired
                ? Colors.red.shade50
                : AppColors.accent.withOpacity(0.08),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
                color: expired
                    ? Colors.red.shade200
                    : AppColors.accent.withOpacity(0.3)),
          ),
          child: Center(
            child: Text(
              expired
                  ? 'OTP expired — request a new one'
                  : 'Expires in ${_fmt(_expirySecs)}',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: expired
                    ? Colors.red.shade700
                    : AppColors.accent,
              ),
            ),
          ),
        ),
        const SizedBox(height: 20),

        // 5 OTP boxes
        _buildOtpBoxes(),
        const SizedBox(height: 20),

        // Verify button
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _verifyOtp,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.accent,
              disabledBackgroundColor: AppColors.accent.withOpacity(0.5),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8)),
            ),
            child: _isLoading
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor:
                            AlwaysStoppedAnimation<Color>(Colors.white)))
                : Text('Verify OTP',
                    style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.white)),
          ),
        ),
        const SizedBox(height: 10),

        // Resend OTP
        Center(
          child: TextButton.icon(
            onPressed: (_resendCooldown > 0 || _isLoading) ? null : _resendOtp,
            icon: Icon(Icons.refresh,
                size: 16,
                color: _resendCooldown > 0
                    ? Colors.grey
                    : AppColors.accent),
            label: Text(
              _resendCooldown > 0
                  ? 'Resend OTP in ${_resendCooldown}s'
                  : 'Resend OTP',
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: _resendCooldown > 0
                    ? Colors.grey
                    : AppColors.accent,
              ),
            ),
          ),
        ),

        // Change number
        Center(
          child: TextButton(
            onPressed: () => setState(() { _step = 1; _error = ''; }),
            child: Text('Change number',
                style: GoogleFonts.inter(
                    fontSize: 12,
                    color: AppColors.textLight,
                    decoration: TextDecoration.underline,
                    decorationColor: AppColors.textLight)),
          ),
        ),
      ],
    );
  }

  /* ══════════════════════════════════════════════════════════════════════
     STEP 3 – COMPLETE PROFILE
  ══════════════════════════════════════════════════════════════════════ */
  Widget _buildStep3() {
    final pw        = _pwCtrl.text;
    final strength  = _pwStrength(pw);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Complete Profile',
            style: GoogleFonts.playfairDisplay(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: AppColors.textDark)),
        const SizedBox(height: 4),
        Text('Almost done! Fill in your remaining details.',
            style: GoogleFonts.inter(
                fontSize: 12, color: AppColors.textMedium)),
        const SizedBox(height: 12),

        _buildErrorBox(),

        // Read-only summary
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.accent.withOpacity(0.07),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
                color: AppColors.accent.withOpacity(0.3)),
          ),
          child: Column(children: [
            _summaryRow('Name',
                '${_firstNameCtrl.text} ${_lastNameCtrl.text}'),
            const SizedBox(height: 4),
            _summaryRow('Mobile',
                '$_countryDial ******$_maskedPhone'),
            const SizedBox(height: 4),
            _summaryRow('Nationality', _nationality),
          ]),
        ),
        const SizedBox(height: 14),

        // Title
        _field(
          label: 'Title',
          child: DropdownButtonFormField<String>(
            value: _title,
            isExpanded: true,
            decoration: _inputDeco('').copyWith(
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            ),
            items: ['Mr', 'Ms', 'Mrs', 'Dr', 'Prof']
                .map((t) => DropdownMenuItem(
                      value: t,
                      child: Text(t,
                          style: const TextStyle(
                              fontSize: 14, color: AppColors.textDark)),
                    ))
                .toList(),
            onChanged: (v) => setState(() => _title = v!),
          ),
        ),

        // Email
        _field(
          label: 'Email Address',
          error: _fieldErrors['email'],
          child: TextFormField(
            controller: _emailCtrl,
            keyboardType: TextInputType.emailAddress,
            decoration: _inputDeco('you@example.com'),
            style:
                const TextStyle(fontSize: 14, color: AppColors.textDark),
            onChanged: (_) =>
                setState(() => _fieldErrors.remove('email')),
          ),
        ),

        // Birthday
        _field(
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
                setState(() {
                  _birthday = picked;
                  _fieldErrors.remove('birthday');
                });
              }
            },
            child: Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.textFieldBg,
                border: Border.all(color: AppColors.border),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      _birthday == null
                          ? 'Select date'
                          : '${_birthday!.day.toString().padLeft(2, '0')} / '
                              '${_birthday!.month.toString().padLeft(2, '0')} / '
                              '${_birthday!.year}',
                      style: TextStyle(
                        fontSize: 14,
                        color: _birthday == null
                            ? AppColors.textLight
                            : AppColors.textDark,
                      ),
                    ),
                    const Icon(Icons.calendar_today_outlined,
                        size: 18, color: AppColors.textMedium),
                  ]),
            ),
          ),
        ),

        // NIC Type + Number
        Row(children: [
          Expanded(
            flex: 2,
            child: _field(
              label: 'ID Type',
              child: DropdownButtonFormField<String>(
                value: _nicType,
                isExpanded: true,
                decoration: _inputDeco('').copyWith(
                  contentPadding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 6),
                ),
                items: ['NIC', 'Passport']
                    .map((t) => DropdownMenuItem(
                          value: t,
                          child: Text(t,
                              style: const TextStyle(
                                  fontSize: 14,
                                  color: AppColors.textDark)),
                        ))
                    .toList(),
                onChanged: (v) => setState(() {
                  _nicType = v!;
                  _fieldErrors.remove('nic');
                }),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            flex: 3,
            child: _field(
              label: _nicType == 'NIC' ? 'NIC Number' : 'Passport No.',
              error: _fieldErrors['nic'],
              child: TextFormField(
                controller: _nicCtrl,
                decoration: _inputDeco(
                    _nicType == 'NIC' ? '200612345678' : 'N1234567'),
                style: const TextStyle(
                    fontSize: 14, color: AppColors.textDark),
                onChanged: (_) =>
                    setState(() => _fieldErrors.remove('nic')),
              ),
            ),
          ),
        ]),

        // Password
        _field(
          label: 'Password',
          error: _fieldErrors['password'],
          child: TextFormField(
            controller: _pwCtrl,
            obscureText: !_showPw,
            decoration: _inputDeco('Min 8 chars, A-Z, 0-9, symbol').copyWith(
              suffixIcon: IconButton(
                icon: Icon(
                  _showPw ? Icons.visibility_off : Icons.visibility,
                  size: 20,
                  color: AppColors.textLight,
                ),
                onPressed: () => setState(() => _showPw = !_showPw),
              ),
            ),
            style:
                const TextStyle(fontSize: 14, color: AppColors.textDark),
            onChanged: (_) =>
                setState(() => _fieldErrors.remove('password')),
          ),
        ),

        // Password strength bar + checklist
        if (pw.isNotEmpty) ...[
          Row(
            children: List.generate(
              4,
              (i) => Expanded(
                child: Container(
                  height: 4,
                  margin: EdgeInsets.only(right: i < 3 ? 4 : 0),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(2),
                    color: i < strength
                        ? _pwColor(strength)
                        : Colors.grey.shade300,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Strength: ${_pwLabel(strength)}',
            style: TextStyle(fontSize: 11, color: _pwColor(strength)),
          ),
          const SizedBox(height: 8),
          ...[
            ['At least 8 characters',      pw.length >= 8],
            ['One uppercase letter (A-Z)',  RegExp(r'[A-Z]').hasMatch(pw)],
            ['One number (0-9)',            RegExp(r'[0-9]').hasMatch(pw)],
            ['One special character',
              RegExp(r'[!@#$%^&*()\-_=+\[\]{};:",.<>/?]').hasMatch(pw)],
          ].map((row) => Padding(
                padding: const EdgeInsets.only(bottom: 3),
                child: Row(children: [
                  Icon(Icons.check_circle_outline,
                      size: 13,
                      color: (row[1] as bool)
                          ? Colors.green
                          : Colors.grey.shade400),
                  const SizedBox(width: 6),
                  Text(row[0] as String,
                      style: TextStyle(
                          fontSize: 11,
                          color: (row[1] as bool)
                              ? Colors.green
                              : Colors.grey.shade500)),
                ]),
              )),
          const SizedBox(height: 8),
        ],

        // Confirm password
        _field(
          label: 'Confirm Password',
          error: _fieldErrors['confirmPassword'],
          child: TextFormField(
            controller: _cpwCtrl,
            obscureText: !_showCpw,
            decoration:
                _inputDeco('Re-enter your password').copyWith(
              suffixIcon: IconButton(
                icon: Icon(
                  _showCpw ? Icons.visibility_off : Icons.visibility,
                  size: 20,
                  color: AppColors.textLight,
                ),
                onPressed: () => setState(() => _showCpw = !_showCpw),
              ),
            ),
            style:
                const TextStyle(fontSize: 14, color: AppColors.textDark),
            onChanged: (_) =>
                setState(() => _fieldErrors.remove('confirmPassword')),
          ),
        ),

        if (_cpwCtrl.text.isNotEmpty && pw != _cpwCtrl.text)
          Padding(
            padding: const EdgeInsets.only(bottom: 8, left: 2),
            child: Text('Passwords do not match.',
                style: const TextStyle(fontSize: 11, color: Colors.red)),
          ),

        const SizedBox(height: 4),

        // Create Account button
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _register,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.accent,
              disabledBackgroundColor: AppColors.accent.withOpacity(0.5),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8)),
            ),
            child: _isLoading
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor:
                            AlwaysStoppedAnimation<Color>(Colors.white)))
                : Text('Create Account',
                    style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.white)),
          ),
        ),
      ],
    );
  }

  Widget _summaryRow(String label, String value) {
    return Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text(label,
          style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppColors.textDark)),
      Text(value,
          style: GoogleFonts.inter(
              fontSize: 12, color: AppColors.textMedium)),
    ]);
  }

  /* ══════════════════════════════════════════════════════════════════════
     STEP 4 – SUCCESS
  ══════════════════════════════════════════════════════════════════════ */
  Widget _buildStep4() {
    return Column(
      children: [
        const SizedBox(height: 12),
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.green.shade100,
          ),
          child: Icon(Icons.check_circle_outline,
              size: 46, color: Colors.green.shade600),
        ),
        const SizedBox(height: 16),
        Text('Registration Successful!',
            style: GoogleFonts.playfairDisplay(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: AppColors.textDark),
            textAlign: TextAlign.center),
        const SizedBox(height: 8),
        Text(
          'Welcome, ${_firstNameCtrl.text} ${_lastNameCtrl.text}!',
          style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: AppColors.accent),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 4),
        Text(
          'Your account has been created.\nSign in to access Lakwedha.',
          style: GoogleFonts.inter(
              fontSize: 13, color: AppColors.textMedium),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            onPressed: () =>
                Navigator.pushReplacementNamed(context, '/sign-in'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.accent,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8)),
            ),
            child: Text('Go to Sign In',
                style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.white)),
          ),
        ),
      ],
    );
  }

  /* ══════════════════════════════════════════════════════════════════════
     BUILD
  ══════════════════════════════════════════════════════════════════════ */
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          // ── Gradient background (same as SignInScreen) ──────────────
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Color(0xFF1A3C1A),
                  Color(0xFF2D5A27),
                  Color(0xFF1A3C1A),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
          ),
          // ── Decorative circle ───────────────────────────────────────
          Positioned(
            top: -60,
            left: -60,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.accentLight.withOpacity(0.08),
              ),
            ),
          ),
          // ── Main content ────────────────────────────────────────────
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(
                    horizontal: 24, vertical: 32),
                child: Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: AppColors.backgroundBlur,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.25),
                        blurRadius: 30,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const LakwedhaLogo(
                        size: 64,
                        layout: LogoLayout.vertical,
                        textColor: Color(0xFF14532d),
                      ),
                      const SizedBox(height: 20),
                      _buildStepIndicator(),
                      const SizedBox(height: 20),
                      _buildCurrentStep(),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCurrentStep() {
    switch (_step) {
      case 1: return _buildStep1();
      case 2: return _buildStep2();
      case 3: return _buildStep3();
      case 4: return _buildStep4();
      default: return const SizedBox();
    }
  }
}
