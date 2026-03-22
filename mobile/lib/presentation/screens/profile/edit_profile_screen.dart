import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  // ── Design tokens ──────────────────────────────────────────────────────────
  static const Color _green     = Color(0xFF2E7D32);
  static const Color _bg        = Color(0xFFF0F4F8);
  static const Color _cardBg    = Colors.white;
  static const Color _text      = Color(0xFF1C2B2C);
  static const Color _subText   = Color(0xFF607D8B);
  static const Color _border    = Color(0xFFE8EDF2);
  static const Color _red       = Color(0xFFC62828);

  // ── Controllers ────────────────────────────────────────────────────────────
  late TextEditingController _firstCtrl;
  late TextEditingController _lastCtrl;
  late TextEditingController _emailCtrl;
  late TextEditingController _currentPwCtrl;
  late TextEditingController _newPwCtrl;
  late TextEditingController _confirmPwCtrl;

  bool _showCurrentPw  = false;
  bool _showNewPw      = false;
  bool _showConfirmPw  = false;
  bool _savingProfile  = false;
  bool _savingPassword = false;

  String? _imagePreviewPath;

  @override
  void initState() {
    super.initState();
    final user = Provider.of<AuthProvider>(context, listen: false).user ?? {};
    _firstCtrl      = TextEditingController(text: user['firstName'] ?? '');
    _lastCtrl       = TextEditingController(text: user['lastName']  ?? '');
    _emailCtrl      = TextEditingController(text: user['email']     ?? '');
    _currentPwCtrl  = TextEditingController();
    _newPwCtrl      = TextEditingController();
    _confirmPwCtrl  = TextEditingController();
    _imagePreviewPath = Provider.of<AuthProvider>(context, listen: false).profileImagePath;
  }

  @override
  void dispose() {
    _firstCtrl.dispose();
    _lastCtrl.dispose();
    _emailCtrl.dispose();
    _currentPwCtrl.dispose();
    _newPwCtrl.dispose();
    _confirmPwCtrl.dispose();
    super.dispose();
  }

  // ── Image picker ───────────────────────────────────────────────────────────
  Future<void> _pickImage() async {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(width: 36, height: 4,
              decoration: BoxDecoration(color: _border,
                borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 20),
            Text('Change Profile Photo', style: GoogleFonts.poppins(
              fontSize: 16, fontWeight: FontWeight.w700, color: _text)),
            const SizedBox(height: 16),
            _sourceOption(Icons.camera_alt_rounded, 'Take a Photo', ImageSource.camera),
            const SizedBox(height: 10),
            _sourceOption(Icons.photo_library_rounded, 'Choose from Gallery', ImageSource.gallery),
            const SizedBox(height: 10),
            if (_imagePreviewPath != null)
              TextButton.icon(
                onPressed: () async {
                  Navigator.pop(context);
                  await Provider.of<AuthProvider>(context, listen: false)
                      .setProfileImage('');
                  setState(() => _imagePreviewPath = null);
                },
                icon: const Icon(Icons.delete_outline_rounded, color: _red),
                label: Text('Remove Photo', style: GoogleFonts.poppins(
                  color: _red, fontWeight: FontWeight.w600)),
              ),
          ],
        ),
      ),
    );
  }

  Widget _sourceOption(IconData icon, String label, ImageSource source) {
    return GestureDetector(
      onTap: () async {
        Navigator.pop(context);
        try {
          final picked = await ImagePicker().pickImage(
            source: source,
            imageQuality: 85,
            maxWidth: 800,
          );
          if (picked != null) {
            setState(() => _imagePreviewPath = picked.path);
            if (mounted) {
              await Provider.of<AuthProvider>(context, listen: false)
                  .setProfileImage(picked.path);
            }
          }
        } catch (_) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(
              content: Text('Could not access $label'),
              backgroundColor: _red,
            ));
          }
        }
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
        decoration: BoxDecoration(
          color: _bg,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: _border),
        ),
        child: Row(children: [
          Icon(icon, color: _green, size: 22),
          const SizedBox(width: 14),
          Text(label, style: GoogleFonts.poppins(
            fontSize: 14, fontWeight: FontWeight.w600, color: _text)),
        ]),
      ),
    );
  }

  // ── Save profile info ──────────────────────────────────────────────────────
  Future<void> _saveProfile() async {
    final first = _firstCtrl.text.trim();
    final last  = _lastCtrl.text.trim();
    final email = _emailCtrl.text.trim();

    if (first.isEmpty || email.isEmpty) {
      _snack('First name and email are required.', error: true);
      return;
    }
    if (!RegExp(r'^[\w.+-]+@[\w-]+\.[a-z]{2,}$').hasMatch(email)) {
      _snack('Enter a valid email address.', error: true);
      return;
    }

    setState(() => _savingProfile = true);
    await Provider.of<AuthProvider>(context, listen: false)
        .updateProfile(firstName: first, lastName: last, email: email);
    setState(() => _savingProfile = false);
    _snack('Profile updated successfully!');
  }

  // ── Change password ────────────────────────────────────────────────────────
  Future<void> _changePassword() async {
    final current = _currentPwCtrl.text;
    final newPw   = _newPwCtrl.text;
    final confirm = _confirmPwCtrl.text;

    if (current.isEmpty || newPw.isEmpty || confirm.isEmpty) {
      _snack('All password fields are required.', error: true);
      return;
    }
    if (newPw.length < 8) {
      _snack('New password must be at least 8 characters.', error: true);
      return;
    }
    if (newPw != confirm) {
      _snack('Passwords do not match.', error: true);
      return;
    }

    setState(() => _savingPassword = true);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final ok = await auth.changePassword(
        currentPassword: current, newPassword: newPw);
    setState(() => _savingPassword = false);

    if (ok) {
      _currentPwCtrl.clear();
      _newPwCtrl.clear();
      _confirmPwCtrl.clear();
      _snack('Password changed successfully!');
    } else {
      _snack(auth.error ?? 'Failed to change password.', error: true);
    }
  }

  void _snack(String msg, {bool error = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg, style: GoogleFonts.poppins(fontSize: 13)),
      backgroundColor: error ? _red : _green,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final auth     = Provider.of<AuthProvider>(context);
    final user     = auth.user ?? {};
    final first    = user['firstName'] ?? 'U';
    final last     = user['lastName']  ?? '';
    final initials = '${first.isNotEmpty ? first[0] : ''}${last.isNotEmpty ? last[0] : ''}'.toUpperCase();

    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: _green,
        foregroundColor: Colors.white,
        title: Text('Edit Profile', style: GoogleFonts.poppins(
          fontWeight: FontWeight.w700, fontSize: 18, color: Colors.white)),
        elevation: 0,
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [

            // ── Avatar picker ────────────────────────────────────────────────
            Center(
              child: GestureDetector(
                onTap: _pickImage,
                child: Stack(
                  children: [
                    Container(
                      width: 100, height: 100,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: _green, width: 3),
                        boxShadow: [BoxShadow(
                          color: Colors.black.withValues(alpha: 0.12),
                          blurRadius: 16, offset: const Offset(0, 4))],
                      ),
                      child: ClipOval(
                        child: _imagePreviewPath != null && _imagePreviewPath!.isNotEmpty
                            ? Image.file(File(_imagePreviewPath!), fit: BoxFit.cover)
                            : Container(
                                color: const Color(0xFF2E7D32),
                                child: Center(
                                  child: Text(initials.isNotEmpty ? initials : '👤',
                                    style: GoogleFonts.poppins(
                                      color: Colors.white, fontSize: 32,
                                      fontWeight: FontWeight.w800)),
                                ),
                              ),
                      ),
                    ),
                    // Camera badge
                    Positioned(bottom: 0, right: 0,
                      child: Container(
                        width: 32, height: 32,
                        decoration: BoxDecoration(
                          color: _green,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                        child: const Icon(Icons.camera_alt_rounded,
                          color: Colors.white, size: 16),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Center(child: Padding(
              padding: const EdgeInsets.only(top: 10),
              child: Text('Tap to change photo', style: GoogleFonts.poppins(
                color: _subText, fontSize: 12)),
            )),

            const SizedBox(height: 28),

            // ── Personal info section ────────────────────────────────────────
            _sectionHeader(Icons.person_rounded, 'Personal Information'),
            const SizedBox(height: 14),
            _card(
              child: Column(
                children: [
                  _field('First Name', _firstCtrl, Icons.person_outline_rounded),
                  const SizedBox(height: 14),
                  _field('Last Name', _lastCtrl, Icons.person_outline_rounded),
                  const SizedBox(height: 14),
                  _field('Email Address', _emailCtrl, Icons.email_outlined,
                    keyboard: TextInputType.emailAddress),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _savingProfile ? null : _saveProfile,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _green,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                      child: _savingProfile
                          ? const SizedBox(height: 18, width: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.white))
                          : Text('Save Profile', style: GoogleFonts.poppins(
                              fontSize: 15, fontWeight: FontWeight.w700,
                              color: Colors.white)),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // ── Change password section ──────────────────────────────────────
            _sectionHeader(Icons.lock_outline_rounded, 'Change Password'),
            const SizedBox(height: 14),
            _card(
              child: Column(
                children: [
                  // Strength hint
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F5E9),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFA5D6A7)),
                    ),
                    child: Row(children: [
                      const Icon(Icons.info_outline_rounded,
                        size: 16, color: Color(0xFF2E7D32)),
                      const SizedBox(width: 8),
                      Expanded(child: Text(
                        'Use at least 8 characters with letters and numbers.',
                        style: GoogleFonts.poppins(
                          fontSize: 11.5, color: const Color(0xFF2E7D32)))),
                    ]),
                  ),
                  const SizedBox(height: 16),
                  _passwordField('Current Password', _currentPwCtrl,
                    _showCurrentPw, () => setState(() => _showCurrentPw = !_showCurrentPw)),
                  const SizedBox(height: 14),
                  _passwordField('New Password', _newPwCtrl,
                    _showNewPw, () => setState(() => _showNewPw = !_showNewPw)),
                  const SizedBox(height: 14),
                  _passwordField('Confirm New Password', _confirmPwCtrl,
                    _showConfirmPw, () => setState(() => _showConfirmPw = !_showConfirmPw)),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _savingPassword ? null : _changePassword,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1565C0),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                      child: _savingPassword
                          ? const SizedBox(height: 18, width: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.white))
                          : Text('Change Password', style: GoogleFonts.poppins(
                              fontSize: 15, fontWeight: FontWeight.w700,
                              color: Colors.white)),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  Widget _sectionHeader(IconData icon, String title) {
    return Row(children: [
      Container(
        width: 34, height: 34,
        decoration: BoxDecoration(
          color: const Color(0xFFE8F5E9),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: _green, size: 18),
      ),
      const SizedBox(width: 10),
      Text(title, style: GoogleFonts.poppins(
        fontSize: 15, fontWeight: FontWeight.w800, color: _text)),
    ]);
  }

  Widget _card({required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: _cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _border),
        boxShadow: [BoxShadow(
          color: Colors.black.withValues(alpha: 0.04),
          blurRadius: 12, offset: const Offset(0, 3))],
      ),
      child: child,
    );
  }

  Widget _field(String label, TextEditingController ctrl, IconData icon,
      {TextInputType keyboard = TextInputType.text}) {
    return TextField(
      controller: ctrl,
      keyboardType: keyboard,
      style: GoogleFonts.poppins(fontSize: 14, color: _text),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: GoogleFonts.poppins(color: _subText, fontSize: 13),
        prefixIcon: Icon(icon, color: _green, size: 20),
        filled: true,
        fillColor: _bg,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _border)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _border)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _green, width: 1.5)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      ),
    );
  }

  Widget _passwordField(String label, TextEditingController ctrl,
      bool visible, VoidCallback toggle) {
    return TextField(
      controller: ctrl,
      obscureText: !visible,
      style: GoogleFonts.poppins(fontSize: 14, color: _text),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: GoogleFonts.poppins(color: _subText, fontSize: 13),
        prefixIcon: const Icon(Icons.lock_outline_rounded, color: _green, size: 20),
        suffixIcon: IconButton(
          icon: Icon(
            visible ? Icons.visibility_off_outlined : Icons.visibility_outlined,
            color: _subText, size: 20),
          onPressed: toggle,
        ),
        filled: true,
        fillColor: _bg,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _border)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _border)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _green, width: 1.5)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      ),
    );
  }
}
