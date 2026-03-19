import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/pharmacy_auth_provider.dart';

// Sri Lanka province → district mapping
const Map<String, List<String>> _provinceDistricts = {
  'Western': ['Colombo', 'Gampaha', 'Kalutara'],
  'Central': ['Kandy', 'Matale', 'Nuwara Eliya'],
  'Southern': ['Galle', 'Matara', 'Hambantota'],
  'Northern': ['Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu'],
  'Eastern': ['Ampara', 'Batticaloa', 'Trincomalee'],
  'North Western': ['Kurunegala', 'Puttalam'],
  'North Central': ['Anuradhapura', 'Polonnaruwa'],
  'Uva': ['Badulla', 'Monaragala'],
  'Sabaragamuwa': ['Ratnapura', 'Kegalle'],
};

class PharmacyRegistrationScreen extends StatefulWidget {
  const PharmacyRegistrationScreen({super.key});

  @override
  State<PharmacyRegistrationScreen> createState() =>
      _PharmacyRegistrationScreenState();
}

class _PharmacyRegistrationScreenState
    extends State<PharmacyRegistrationScreen> {
  final PageController _pageController = PageController();
  int _currentStep = 0;

  // Step 1 — Pharmacy Details
  final _step1Key = GlobalKey<FormState>();
  final _pharmacyNameCtrl = TextEditingController();
  final _businessRegCtrl = TextEditingController();
  final _permitCtrl = TextEditingController();

  // Step 2 — Location
  final _step2Key = GlobalKey<FormState>();
  String? _province;
  String? _district;
  final _cityCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _postalCtrl = TextEditingController();

  // Step 3 — Owner
  final _step3Key = GlobalKey<FormState>();
  final _ownerNameCtrl = TextEditingController();
  final _ownerNICCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmPassCtrl = TextEditingController();
  bool _obscurePass = true;
  bool _obscureConfirm = true;

  @override
  void dispose() {
    _pageController.dispose();
    _pharmacyNameCtrl.dispose();
    _businessRegCtrl.dispose();
    _permitCtrl.dispose();
    _cityCtrl.dispose();
    _addressCtrl.dispose();
    _postalCtrl.dispose();
    _ownerNameCtrl.dispose();
    _ownerNICCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmPassCtrl.dispose();
    super.dispose();
  }

  void _nextStep() {
    final keys = [_step1Key, _step2Key, _step3Key];
    if (!keys[_currentStep].currentState!.validate()) return;

    // Extra validation for step 2 dropdowns
    if (_currentStep == 1) {
      if (_province == null) {
        _showError('Please select a province.');
        return;
      }
      if (_district == null) {
        _showError('Please select a district.');
        return;
      }
    }

    if (_currentStep < 2) {
      setState(() => _currentStep++);
      _pageController.animateToPage(
        _currentStep,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      _submit();
    }
  }

  void _prevStep() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
      _pageController.animateToPage(
        _currentStep,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  Future<void> _submit() async {
    final provider =
        context.read<PharmacyAuthProvider>();

    final success = await provider.register(
      pharmacyName: _pharmacyNameCtrl.text.trim(),
      businessRegNumber: _businessRegCtrl.text.trim(),
      permitNumber: _permitCtrl.text.trim(),
      province: _province!,
      district: _district!,
      city: _cityCtrl.text.trim(),
      address: _addressCtrl.text.trim(),
      postalCode: _postalCtrl.text.trim(),
      ownerName: _ownerNameCtrl.text.trim(),
      ownerNIC: _ownerNICCtrl.text.trim(),
      email: _emailCtrl.text.trim(),
      password: _passwordCtrl.text,
    );

    if (!mounted) return;

    if (success) {
      Navigator.of(context)
          .pushReplacementNamed('/pharmacy/pending');
    } else {
      _showError(provider.error ?? 'Registration failed.');
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
  }

  // ─────────────────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PharmacyAuthProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF0F4F8),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0D5C3E),
        title: const Text('Pharmacy Registration'),
        leading: _currentStep > 0
            ? IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.white),
                onPressed: _prevStep,
              )
            : null,
      ),
      body: Column(
        children: [
          _StepIndicator(currentStep: _currentStep),
          Expanded(
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _buildStep1(),
                _buildStep2(),
                _buildStep3(provider),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Step indicator ────────────────────────────────────────────────────────────
  // (handled by _StepIndicator widget below)

  // ── Step 1: Pharmacy Details ──────────────────────────────────────────────────
  Widget _buildStep1() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Form(
        key: _step1Key,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _sectionTitle('Pharmacy Details'),
            const SizedBox(height: 16),
            _field(
              controller: _pharmacyNameCtrl,
              label: 'Pharmacy Name',
              icon: Icons.local_pharmacy_outlined,
              validator: (v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 14),
            _field(
              controller: _businessRegCtrl,
              label: 'Business Registration Number',
              icon: Icons.badge_outlined,
              validator: (v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 14),
            _field(
              controller: _permitCtrl,
              label: 'Permit Number',
              icon: Icons.verified_outlined,
              validator: (v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 32),
            _nextButton('Next'),
          ],
        ),
      ),
    );
  }

  // ── Step 2: Location ──────────────────────────────────────────────────────────
  Widget _buildStep2() {
    final districts =
        _province != null ? _provinceDistricts[_province!] ?? [] : <String>[];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Form(
        key: _step2Key,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _sectionTitle('Location Details'),
            const SizedBox(height: 16),
            _dropdownField(
              label: 'Province',
              value: _province,
              items: _provinceDistricts.keys.toList(),
              icon: Icons.map_outlined,
              onChanged: (v) => setState(() {
                _province = v;
                _district = null; // reset district on province change
              }),
            ),
            const SizedBox(height: 14),
            _dropdownField(
              label: 'District',
              value: _district,
              items: districts,
              icon: Icons.location_city_outlined,
              onChanged: (v) => setState(() => _district = v),
            ),
            const SizedBox(height: 14),
            _field(
              controller: _cityCtrl,
              label: 'City',
              icon: Icons.location_on_outlined,
              validator: (v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 14),
            _field(
              controller: _addressCtrl,
              label: 'Address',
              icon: Icons.home_outlined,
              maxLines: 2,
              validator: (v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 14),
            _field(
              controller: _postalCtrl,
              label: 'Postal Code',
              icon: Icons.markunread_mailbox_outlined,
              keyboardType: TextInputType.number,
              validator: (v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 32),
            Row(
              children: [
                Expanded(child: _backButton()),
                const SizedBox(width: 12),
                Expanded(child: _nextButton('Next')),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ── Step 3: Owner Details ─────────────────────────────────────────────────────
  Widget _buildStep3(PharmacyAuthProvider provider) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Form(
        key: _step3Key,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _sectionTitle('Owner Details'),
            const SizedBox(height: 16),
            _field(
              controller: _ownerNameCtrl,
              label: 'Owner Name',
              icon: Icons.person_outline,
              validator: (v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 14),
            _field(
              controller: _ownerNICCtrl,
              label: 'NIC Number',
              icon: Icons.credit_card_outlined,
              validator: (v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 14),
            _field(
              controller: _emailCtrl,
              label: 'Email',
              icon: Icons.email_outlined,
              keyboardType: TextInputType.emailAddress,
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'Required';
                if (!v.contains('@')) return 'Enter a valid email';
                return null;
              },
            ),
            const SizedBox(height: 14),
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
                fillColor: Colors.white,
              ),
              validator: (v) {
                if (v == null || v.isEmpty) return 'Required';
                if (v.length < 6) return 'Minimum 6 characters';
                return null;
              },
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _confirmPassCtrl,
              obscureText: _obscureConfirm,
              decoration: InputDecoration(
                labelText: 'Confirm Password',
                prefixIcon: const Icon(Icons.lock_outline,
                    color: Color(0xFF0D5C3E)),
                suffixIcon: IconButton(
                  icon: Icon(_obscureConfirm
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined),
                  onPressed: () =>
                      setState(() => _obscureConfirm = !_obscureConfirm),
                ),
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10)),
                filled: true,
                fillColor: Colors.white,
              ),
              validator: (v) {
                if (v == null || v.isEmpty) return 'Required';
                if (v != _passwordCtrl.text) return 'Passwords do not match';
                return null;
              },
            ),
            const SizedBox(height: 32),
            Row(
              children: [
                Expanded(child: _backButton()),
                const SizedBox(width: 12),
                Expanded(
                  child: provider.loading
                      ? const Center(child: CircularProgressIndicator())
                      : _nextButton('Submit'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Center(
              child: TextButton(
                onPressed: () =>
                    Navigator.of(context).pushReplacementNamed('/pharmacy/login'),
                child: const Text(
                  'Already registered? Login',
                  style: TextStyle(color: Color(0xFF0D5C3E)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  Widget _sectionTitle(String title) => Text(
        title,
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: Color(0xFF0D5C3E),
        ),
      );

  Widget _field({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    String? Function(String?)? validator,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
  }) =>
      TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        maxLines: maxLines,
        validator: validator,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: Icon(icon, color: const Color(0xFF0D5C3E)),
          border:
              OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
          filled: true,
          fillColor: Colors.white,
        ),
      );

  Widget _dropdownField({
    required String label,
    required String? value,
    required List<String> items,
    required IconData icon,
    required void Function(String?) onChanged,
  }) =>
      DropdownButtonFormField<String>(
        initialValue: value,
        items: items
            .map((e) => DropdownMenuItem(value: e, child: Text(e)))
            .toList(),
        onChanged: onChanged,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: Icon(icon, color: const Color(0xFF0D5C3E)),
          border:
              OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
          filled: true,
          fillColor: Colors.white,
        ),
      );

  Widget _nextButton(String label) => ElevatedButton(
        onPressed: _nextStep,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF0D5C3E),
          minimumSize: const Size(double.infinity, 48),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
        child: Text(label,
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.w600)),
      );

  Widget _backButton() => OutlinedButton(
        onPressed: _prevStep,
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(double.infinity, 48),
          side: const BorderSide(color: Color(0xFF0D5C3E)),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
        child: const Text('Back',
            style: TextStyle(
                color: Color(0xFF0D5C3E), fontWeight: FontWeight.w600)),
      );
}

// ── Step indicator widget ─────────────────────────────────────────────────────

class _StepIndicator extends StatelessWidget {
  final int currentStep;
  const _StepIndicator({required this.currentStep});

  @override
  Widget build(BuildContext context) {
    const labels = ['Pharmacy', 'Location', 'Owner'];
    return Container(
      color: const Color(0xFF0D5C3E),
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 20),
      child: Row(
        children: List.generate(labels.length * 2 - 1, (i) {
          if (i.isOdd) {
            // Connector line
            return Expanded(
              child: Container(
                height: 2,
                color: i ~/ 2 < currentStep
                    ? Colors.white
                    : Colors.white38,
              ),
            );
          }
          final step = i ~/ 2;
          final active = step == currentStep;
          final done = step < currentStep;
          return Column(
            children: [
              CircleAvatar(
                radius: 14,
                backgroundColor: (active || done)
                    ? Colors.white
                    : Colors.white38,
                child: done
                    ? const Icon(Icons.check,
                        color: Color(0xFF0D5C3E), size: 16)
                    : Text(
                        '${step + 1}',
                        style: TextStyle(
                          color: active
                              ? const Color(0xFF0D5C3E)
                              : Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
              ),
              const SizedBox(height: 4),
              Text(
                labels[step],
                style: TextStyle(
                  color: active ? Colors.white : Colors.white70,
                  fontSize: 10,
                  fontWeight:
                      active ? FontWeight.w700 : FontWeight.normal,
                ),
              ),
            ],
          );
        }),
      ),
    );
  }
}
