import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/lakwedha_logo.dart';
import '../../../features/auth/widgets/custom_text_field.dart';
import '../../../features/auth/widgets/auth_button.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;

    if (_passwordController.text != _confirmPasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text(AppStrings.passwordsDoNotMatch),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      return;
    }

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final fullName =
        '${_firstNameController.text.trim()} ${_lastNameController.text.trim()}';
    final success = await auth.register(
      name: fullName,
      email: _emailController.text.trim(),
      password: _passwordController.text,
    );

    if (!mounted) return;
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text(AppStrings.registrationSuccess),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      Navigator.pushReplacementNamed(context, '/sign-in');
    } else if (auth.error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(auth.error!),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Background gradient
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF1A3C1A), Color(0xFF2D5A27), Color(0xFF1A3C1A)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
          ),
          // Decorative circles
          Positioned(
            top: -60,
            right: -60,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.accentLight.withValues(alpha: 0.08),
              ),
            ),
          ),
          Positioned(
            bottom: -80,
            left: -80,
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.primary.withValues(alpha: 0.15),
              ),
            ),
          ),
          // Main content
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
                        const LakwedhaLogo(size: 72),
                        const SizedBox(height: 16),
                        Text(
                          AppStrings.signUp,
                          style: GoogleFonts.playfairDisplay(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textDark,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          AppStrings.createAccount,
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: AppColors.accent,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 28),

                        // First & Last Name row
                        Row(
                          children: [
                            Expanded(
                              child: CustomTextField(
                                label: 'First Name',
                                hint: 'First name',
                                controller: _firstNameController,
                                validator: (v) => (v == null || v.trim().isEmpty)
                                    ? AppStrings.fieldRequired
                                    : null,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: CustomTextField(
                                label: 'Last Name',
                                hint: 'Last name',
                                controller: _lastNameController,
                                validator: (v) => (v == null || v.trim().isEmpty)
                                    ? AppStrings.fieldRequired
                                    : null,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Email
                        CustomTextField(
                          label: AppStrings.emailLabel,
                          hint: AppStrings.emailHint,
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          validator: (v) {
                            if (v == null || v.trim().isEmpty) {
                              return AppStrings.fieldRequired;
                            }
                            if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
                                .hasMatch(v.trim())) {
                              return AppStrings.invalidEmail;
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),

                        // Password
                        CustomTextField(
                          label: AppStrings.passwordLabel,
                          hint: AppStrings.passwordHint,
                          controller: _passwordController,
                          isPassword: true,
                          validator: (v) {
                            if (v == null || v.isEmpty) {
                              return AppStrings.fieldRequired;
                            }
                            if (v.length < 6) {
                              return AppStrings.passwordTooShort;
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),

                        // Confirm Password
                        CustomTextField(
                          label: AppStrings.confirmPasswordLabel,
                          hint: AppStrings.confirmPasswordHint,
                          controller: _confirmPasswordController,
                          isPassword: true,
                          validator: (v) => (v == null || v.isEmpty)
                              ? AppStrings.fieldRequired
                              : null,
                        ),
                        const SizedBox(height: 24),

                        // Register button
                        Consumer<AuthProvider>(
                          builder: (_, auth, __) => AuthButton(
                            label: AppStrings.signUp,
                            onPressed: _register,
                            isLoading: auth.isLoading,
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Sign In link
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              AppStrings.alreadyHaveAccount,
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textDark,
                              ),
                            ),
                            GestureDetector(
                              onTap: () =>
                                  Navigator.pushReplacementNamed(context, '/sign-in'),
                              child: Text(
                                AppStrings.signInLink,
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
