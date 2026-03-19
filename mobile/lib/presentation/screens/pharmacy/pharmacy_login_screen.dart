import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/pharmacy_auth_provider.dart';

class PharmacyLoginScreen extends StatefulWidget {
  const PharmacyLoginScreen({super.key});

  @override
  State<PharmacyLoginScreen> createState() => _PharmacyLoginScreenState();
}

class _PharmacyLoginScreenState extends State<PharmacyLoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscurePass = true;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;

    final provider = context.read<PharmacyAuthProvider>();
    provider.clearError();

    await provider.login(
      email: _emailCtrl.text.trim(),
      password: _passwordCtrl.text,
    );

    if (!mounted) return;

    switch (provider.status) {
      case PharmacyAuthStatus.approved:
        Navigator.of(context).pushReplacementNamed('/pharmacy/dashboard');
        break;
      case PharmacyAuthStatus.pending:
        Navigator.of(context).pushReplacementNamed('/pharmacy/pending');
        break;
      case PharmacyAuthStatus.rejected:
        Navigator.of(context).pushReplacementNamed('/pharmacy/rejected');
        break;
      default:
        if (provider.error != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(provider.error!),
              backgroundColor: Colors.red,
            ),
          );
        }
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PharmacyAuthProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF0F4F8),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Logo / header
              Center(
                child: Column(
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: const Color(0xFF0D5C3E),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Icon(
                        Icons.local_pharmacy,
                        size: 44,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Pharmacy Portal',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0D5C3E),
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Sign in to your pharmacy account',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 40),

              // Form card
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withAlpha(13),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      TextFormField(
                        controller: _emailCtrl,
                        keyboardType: TextInputType.emailAddress,
                        decoration: InputDecoration(
                          labelText: 'Email',
                          prefixIcon: const Icon(Icons.email_outlined,
                              color: Color(0xFF0D5C3E)),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10)),
                          filled: true,
                          fillColor: const Color(0xFFF8F9FA),
                        ),
                        validator: (v) {
                          if (v == null || v.trim().isEmpty) {
                            return 'Email is required';
                          }
                          if (!v.contains('@')) return 'Enter a valid email';
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _passwordCtrl,
                        obscureText: _obscurePass,
                        decoration: InputDecoration(
                          labelText: 'Password',
                          prefixIcon: const Icon(Icons.lock_outline,
                              color: Color(0xFF0D5C3E)),
                          suffixIcon: IconButton(
                            icon: Icon(_obscurePass
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined),
                            onPressed: () =>
                                setState(() => _obscurePass = !_obscurePass),
                          ),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10)),
                          filled: true,
                          fillColor: const Color(0xFFF8F9FA),
                        ),
                        validator: (v) =>
                            v == null || v.isEmpty ? 'Password is required' : null,
                      ),
                      const SizedBox(height: 24),
                      provider.loading
                          ? const CircularProgressIndicator()
                          : ElevatedButton(
                              onPressed: _login,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF0D5C3E),
                                minimumSize: const Size(double.infinity, 50),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(10)),
                              ),
                              child: const Text(
                                'Login',
                                style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.white),
                              ),
                            ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),
              Center(
                child: TextButton(
                  onPressed: () => Navigator.of(context)
                      .pushNamed('/pharmacy/register'),
                  child: const Text.rich(
                    TextSpan(
                      text: "Don't have an account? ",
                      style: TextStyle(color: Colors.grey),
                      children: [
                        TextSpan(
                          text: 'Register Pharmacy',
                          style: TextStyle(
                            color: Color(0xFF0D5C3E),
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
