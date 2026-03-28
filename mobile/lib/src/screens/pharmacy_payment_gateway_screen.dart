import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:ravana_app/data/datasources/remote/api_service.dart';
import 'package:ravana_app/src/core/payment_js_helper.dart';

const _primary = Color(0xFF0D5C3E);

class PharmacyPaymentGatewayScreen extends StatefulWidget {
  final String requestId;
  final String pharmacyName;
  final num amount;

  const PharmacyPaymentGatewayScreen({
    super.key,
    required this.requestId,
    required this.pharmacyName,
    required this.amount,
  });

  @override
  State<PharmacyPaymentGatewayScreen> createState() =>
      _PharmacyPaymentGatewayScreenState();
}

class _PharmacyPaymentGatewayScreenState
    extends State<PharmacyPaymentGatewayScreen> {
  final _api = ApiService();
  final _formKey = GlobalKey<FormState>();

  final _cardNumberCtrl = TextEditingController();
  final _holderCtrl = TextEditingController();
  final _expiryCtrl = TextEditingController();
  final _cvvCtrl = TextEditingController();

  bool _isSubmitting = false;

  @override
  void dispose() {
    _cardNumberCtrl.dispose();
    _holderCtrl.dispose();
    _expiryCtrl.dispose();
    _cvvCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);
    try {
      final paymentData =
          await _api.initiatePharmacyRequestPayment(widget.requestId);

      if (!kIsWeb) {
        // PayHere JS checkout is web-only in this app build.
        await _api.confirmPharmacyRequestPayment(widget.requestId);
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Payment successful.'),
            backgroundColor: _primary,
          ),
        );
        Navigator.pop(context, true);
        return;
      }

      var loaded = isPayhereLoaded();
      if (!loaded) {
        injectPayhereScript();
        for (int i = 0; i < 20; i++) {
          await Future.delayed(const Duration(milliseconds: 250));
          loaded = isPayhereLoaded();
          if (loaded) break;
        }
      }

      if (!loaded) {
        throw Exception('PayHere checkout did not load. Please try again.');
      }

      startPayherePayment(
        paymentData: paymentData,
        onCompleted: (_) {
          _confirmAfterGateway();
        },
        onDismissed: () {
          if (!mounted) return;
          setState(() => _isSubmitting = false);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Payment was cancelled.'),
              backgroundColor: Colors.orange,
            ),
          );
        },
        onError: (err) {
          if (!mounted) return;
          setState(() => _isSubmitting = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('PayHere error: $err'),
              backgroundColor: Colors.red,
            ),
          );
        },
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceFirst('Exception: ', '')),
          backgroundColor: Colors.red.shade700,
        ),
      );
    }
  }

  Future<void> _confirmAfterGateway() async {
    try {
      await _api.confirmPharmacyRequestPayment(widget.requestId);
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Payment successful.'),
          backgroundColor: _primary,
        ),
      );
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceFirst('Exception: ', '')),
          backgroundColor: Colors.red.shade700,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text('Payment Gateway'),
        backgroundColor: _primary,
        foregroundColor: Colors.white,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.pharmacyName,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: _primary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Amount: LKR ${widget.amount}',
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            _field(
              controller: _cardNumberCtrl,
              label: 'Card Number',
              hint: '1234 5678 9012 3456',
              icon: Icons.credit_card_rounded,
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
            _field(
              controller: _holderCtrl,
              label: 'Cardholder Name',
              hint: 'As printed on card',
              icon: Icons.person_outline_rounded,
              textCapitalization: TextCapitalization.characters,
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'Cardholder name is required';
                return null;
              },
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _field(
                    controller: _expiryCtrl,
                    label: 'Expiry (MM/YY)',
                    hint: '08/28',
                    icon: Icons.date_range_rounded,
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      _ExpiryFormatter(),
                    ],
                    maxLength: 5,
                    validator: (v) {
                      if (v == null || v.length != 5) return 'MM/YY required';
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _field(
                    controller: _cvvCtrl,
                    label: 'CVV',
                    hint: '123',
                    icon: Icons.lock_outline_rounded,
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
            const SizedBox(height: 24),
            SizedBox(
              height: 50,
              child: ElevatedButton.icon(
                onPressed: _isSubmitting ? null : _submit,
                icon: _isSubmitting
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.lock_rounded),
                label: Text(_isSubmitting ? 'Submitting...' : 'Submit Payment'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _primary,
                  foregroundColor: Colors.white,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _field({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
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
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: Icon(icon),
        counterText: '',
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    );
  }
}

class _CardNumberFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final digits = newValue.text.replaceAll(RegExp(r'\D'), '');
    final buffer = StringBuffer();
    for (var i = 0; i < digits.length && i < 16; i++) {
      if (i > 0 && i % 4 == 0) buffer.write(' ');
      buffer.write(digits[i]);
    }
    final out = buffer.toString();
    return TextEditingValue(
      text: out,
      selection: TextSelection.collapsed(offset: out.length),
    );
  }
}

class _ExpiryFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final digits = newValue.text.replaceAll(RegExp(r'\D'), '');
    var out = '';
    if (digits.length <= 2) {
      out = digits;
    } else {
      out = '${digits.substring(0, 2)}/${digits.substring(2, digits.length > 4 ? 4 : digits.length)}';
    }
    return TextEditingValue(
      text: out,
      selection: TextSelection.collapsed(offset: out.length),
    );
  }
}
