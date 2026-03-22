import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../presentation/providers/auth_provider.dart';
import '../../../presentation/widgets/lakwedha_logo.dart';
import '../widgets/auth_button.dart';
import '../widgets/custom_text_field.dart';

class SignInScreen extends StatefulWidget {
  const SignInScreen({super.key});

  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {
  final _formKey            = GlobalKey<FormState>();
  final _credentialCtrl     = TextEditingController();
  final _passwordCtrl       = TextEditingController();
  bool  _isLoading          = false;

  @override
  void dispose() {
    _credentialCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  // ── Sign In ──────────────────────────────────────────────────────────────

  Future<void> _signIn() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    try {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final success = await auth.login(
        _credentialCtrl.text.trim(),
        _passwordCtrl.text,
      );
      if (!mounted) return;
      if (success) {
        Navigator.pushReplacementNamed(context, '/home');
      } else if (auth.isSuspended) {
        Navigator.pushReplacementNamed(context, '/suspended');
      } else {
        _showError(auth.error ?? AppStrings.invalidCredentials);
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _continueAsGuest() async {
    Provider.of<AuthProvider>(context, listen: false).continueAsGuest();
    if (!mounted) return;
    Navigator.pushReplacementNamed(context, '/home');
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  // ── Build ────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          // ── Background gradient
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF1A3C1A), Color(0xFF2D5A27), Color(0xFF1A3C1A)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
          ),

          // ── Decorative circles
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

          // ── Card content
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
                  child: Form(
                    key: _formKey,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Logo
                        const LakwedhaLogo(size: 80),
                        const SizedBox(height: 16),

                        Text(
                          AppStrings.signIn,
                          style: GoogleFonts.playfairDisplay(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textDark,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          AppStrings.welcomeBack,
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: AppColors.accent,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 28),

                        // Credential
                        CustomTextField(
                          label: AppStrings.credentialLabel,
                          hint: AppStrings.credentialHint,
                          controller: _credentialCtrl,
                          keyboardType: TextInputType.text,
                          validator: (v) =>
                              (v == null || v.trim().isEmpty) ? AppStrings.fieldRequired : null,
                        ),
                        const SizedBox(height: 16),

                        // Password
                        CustomTextField(
                          label: AppStrings.passwordLabel,
                          hint: AppStrings.passwordHint,
                          controller: _passwordCtrl,
                          isPassword: true,
                          validator: (v) =>
                              (v == null || v.isEmpty) ? AppStrings.fieldRequired : null,
                        ),
                        const SizedBox(height: 8),

                        // Forgot password
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(
                            onPressed: () =>
                                Navigator.pushNamed(context, '/forgot-password'),
                            style: TextButton.styleFrom(
                              padding: EdgeInsets.zero,
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            child: Text(
                              AppStrings.forgotPassword,
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                color: AppColors.accent,
                                fontWeight: FontWeight.w500,
                                decoration: TextDecoration.underline,
                                decorationColor: AppColors.accent,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Sign In button
                        AuthButton(
                          label: AppStrings.signIn,
                          onPressed: _signIn,
                          isLoading: _isLoading,
                        ),
                        const SizedBox(height: 12),

                        // Continue as Guest
                        AuthButton(
                          label: AppStrings.continueAsGuest,
                          onPressed: _continueAsGuest,
                          style: AuthButtonStyle.secondary,
                        ),
                        const SizedBox(height: 20),

                        // Sign Up link
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              AppStrings.newUser,
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textDark,
                              ),
                            ),
                            GestureDetector(
                              onTap: () =>
                                  Navigator.pushNamed(context, '/sign-up'),
                              child: Text(
                                AppStrings.signUpLink,
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.accent,
                                  decoration: TextDecoration.underline,
                                  decorationColor: AppColors.accent,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
