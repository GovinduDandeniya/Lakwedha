import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shimmer/shimmer.dart';
import 'package:ravana_app/src/theme/app_theme.dart';
import 'package:ravana_app/src/core/api_client.dart';
import 'package:ravana_app/src/core/payment_service.dart';

/// Payment Selection Screen
/// Patient selects a payment method and completes checkout.
/// On success: shows success screen, then goes back to orders list.

final _orderProvider =
    FutureProvider.family.autoDispose<Map<String, dynamic>, String>(
  (ref, orderId) async {
    final dio = ref.watch(dioProvider);
    final response = await dio.get('/api/v1/orders/$orderId');
    return response.data['data'] as Map<String, dynamic>;
  },
);

class PaymentSelectionScreen extends ConsumerStatefulWidget {
  final String orderId;
  const PaymentSelectionScreen({super.key, required this.orderId});

  @override
  ConsumerState<PaymentSelectionScreen> createState() =>
      _PaymentSelectionScreenState();
}

class _PaymentSelectionScreenState
    extends ConsumerState<PaymentSelectionScreen> {
  String _selectedMethod = 'card';
  bool _isProcessing = false;
  bool _isSuccess = false;
  String? _errorMessage;

  Future<void> _handlePayment() async {
    setState(() {
      _isProcessing = true;
      _errorMessage = null;
    });

    final paymentService = ref.read(paymentServiceProvider);

    if (_selectedMethod == 'card') {
      await paymentService.processOrderPayment(
        orderId: widget.orderId,
        onSuccess: _onSuccess,
        onError: _onError,
      );
    } else {
      await paymentService.processCODPayment(
        orderId: widget.orderId,
        onSuccess: _onSuccess,
        onError: _onError,
      );
    }

    if (mounted) setState(() => _isProcessing = false);
  }

  void _onSuccess() {
    if (!mounted) return;
    HapticFeedback.heavyImpact();
    setState(() {
      _isSuccess = true;
      _isProcessing = false;
    });
    // Auto-redirect back to orders after 2.5 seconds
    Future.delayed(const Duration(milliseconds: 2500), () {
      if (mounted) Navigator.of(context).pop();
    });
  }

  void _onError(String err) {
    if (!mounted) return;
    setState(() {
      _errorMessage = err;
      _isProcessing = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    // Show success screen on top of everything
    if (_isSuccess) return _buildSuccessScreen();

    final orderAsync = ref.watch(_orderProvider(widget.orderId));

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          'Checkout',
          style: TextStyle(
              fontWeight: FontWeight.w900, color: AppTheme.primaryColor),
        ),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded,
              color: AppTheme.primaryColor),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: orderAsync.when(
        data: (order) => _buildCheckout(order),
        loading: () => _buildLoading(),
        error: (e, _) => Center(
          child: Text('Failed to load order: $e',
              style: const TextStyle(color: Colors.red)),
        ),
      ),
    );
  }

  // ─── Success Screen ──────────────────────────────────────────────────────

  Widget _buildSuccessScreen() {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(40),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Checkmark circle
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_circle_rounded,
                    size: 80, color: AppTheme.primaryColor),
              )
                  .animate()
                  .scale(
                      duration: 500.ms,
                      curve: Curves.elasticOut,
                      begin: const Offset(0.3, 0.3))
                  .fadeIn(),

              const SizedBox(height: 32),

              const Text(
                'Payment Successful!',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  color: AppTheme.primaryColor,
                ),
              ).animate(delay: 300.ms).fadeIn().slideY(begin: 0.2, end: 0),

              const SizedBox(height: 12),

              const Text(
                'Your order has been confirmed.\nYou will be redirected shortly.',
                textAlign: TextAlign.center,
                style: TextStyle(
                    color: Colors.grey, fontSize: 15, height: 1.5),
              ).animate(delay: 450.ms).fadeIn(),

              const SizedBox(height: 48),

              // Progress dots
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  3,
                  (i) => Container(
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withValues(
                          alpha: i == 0 ? 1.0 : 0.3),
                      shape: BoxShape.circle,
                    ),
                  )
                      .animate(
                          delay: Duration(milliseconds: 600 + i * 200),
                          onPlay: (c) => c.repeat())
                      .fadeIn(duration: 400.ms)
                      .then()
                      .fadeOut(duration: 400.ms),
                ),
              ).animate(delay: 600.ms).fadeIn(),

              const SizedBox(height: 16),

              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text(
                  'Back to my orders',
                  style: TextStyle(
                      color: AppTheme.primaryColor,
                      fontWeight: FontWeight.bold),
                ),
              ).animate(delay: 700.ms).fadeIn(),
            ],
          ),
        ),
      ),
    );
  }

  // ─── Checkout Form ───────────────────────────────────────────────────────

  Widget _buildLoading() {
    return Center(
      child: Shimmer.fromColors(
        baseColor: Colors.grey[300]!,
        highlightColor: Colors.grey[100]!,
        child: Container(
            margin: const EdgeInsets.all(24),
            height: 200,
            decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(28))),
      ),
    );
  }

  Widget _buildCheckout(Map<String, dynamic> order) {
    final totalAmount = order['totalAmount'] as num? ?? 0;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Secure Payment',
              style: TextStyle(
                  fontSize: 30,
                  fontWeight: FontWeight.w900,
                  color: AppTheme.primaryColor)),
          const Text('Complete your Ayurvedic order safely.',
              style: TextStyle(color: Colors.grey, fontSize: 14)),

          const SizedBox(height: 28),

          // Amount card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [AppTheme.primaryColor, AppTheme.secondaryColor],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(28),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.primaryColor.withValues(alpha: 0.3),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('TOTAL TO PAY',
                    style: TextStyle(
                        color: Colors.white70,
                        fontSize: 11,
                        letterSpacing: 1.5,
                        fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text(
                  'LKR ${totalAmount.toStringAsFixed(2)}',
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 36,
                      fontWeight: FontWeight.w900),
                ),
              ],
            ),
          ).animate().slideY(
              begin: 0.2, end: 0, duration: 500.ms, curve: Curves.easeOut),

          const SizedBox(height: 36),

          // Error
          if (_errorMessage != null) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                  color: Colors.red[50],
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.red[200]!)),
              child: Row(
                children: [
                  const Icon(Icons.error_outline, color: Colors.red),
                  const SizedBox(width: 12),
                  Expanded(
                      child: Text(_errorMessage!,
                          style: const TextStyle(
                              color: Colors.red, fontSize: 13))),
                ],
              ),
            ).animate().shake(),
            const SizedBox(height: 24),
          ],

          // Method label
          const Text('PAYMENT METHOD',
              style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 2,
                  color: Colors.grey)),
          const SizedBox(height: 14),

          _MethodTile(
            icon: Icons.credit_card_rounded,
            label: 'Credit / Debit Card',
            sublabel: 'Powered by PayHere',
            selected: _selectedMethod == 'card',
            onTap: () => setState(() => _selectedMethod = 'card'),
          ),
          const SizedBox(height: 12),
          _MethodTile(
            icon: Icons.delivery_dining_rounded,
            label: 'Cash on Delivery',
            sublabel: 'Pay when you receive',
            selected: _selectedMethod == 'cod',
            onTap: () => setState(() => _selectedMethod = 'cod'),
          ),

          const SizedBox(height: 40),

          // Confirm button
          SizedBox(
            width: double.infinity,
            height: 60,
            child: ElevatedButton(
              onPressed: _isProcessing ? null : _handlePayment,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.secondaryColor,
                foregroundColor: Colors.white,
                disabledBackgroundColor:
                    AppTheme.secondaryColor.withValues(alpha: 0.5),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20)),
                elevation: 8,
                shadowColor:
                    AppTheme.secondaryColor.withValues(alpha: 0.4),
              ),
              child: _isProcessing
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2.5),
                    )
                  : const Text('CONFIRM PAYMENT',
                      style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1)),
            ),
          ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.1, end: 0),

          const SizedBox(height: 16),

          Center(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.lock_outline,
                    size: 12, color: Colors.grey.shade400),
                const SizedBox(width: 4),
                Text('256-bit SSL encrypted',
                    style: TextStyle(
                        fontSize: 11, color: Colors.grey.shade400)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Method Tile ──────────────────────────────────────────────────────────────

class _MethodTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String sublabel;
  final bool selected;
  final VoidCallback onTap;

  const _MethodTile({
    required this.icon,
    required this.label,
    required this.sublabel,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding:
            const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
        decoration: BoxDecoration(
          color: selected
              ? AppTheme.primaryColor.withValues(alpha: 0.05)
              : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
              color: selected
                  ? AppTheme.primaryColor
                  : Colors.grey.shade200,
              width: 2),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: selected
                    ? AppTheme.primaryColor.withValues(alpha: 0.1)
                    : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon,
                  color: selected
                      ? AppTheme.primaryColor
                      : Colors.grey.shade500,
                  size: 22),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                          color: selected
                              ? AppTheme.primaryColor
                              : Colors.grey.shade700)),
                  Text(sublabel,
                      style: TextStyle(
                          fontSize: 11, color: Colors.grey.shade500)),
                ],
              ),
            ),
            if (selected)
              const Icon(Icons.check_circle_rounded,
                  color: AppTheme.primaryColor, size: 20),
          ],
        ),
      ),
    );
  }
}
