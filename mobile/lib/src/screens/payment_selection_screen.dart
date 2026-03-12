import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shimmer/shimmer.dart';
// PayHere SDK is mobile-only. Import is conditionally used via kIsWeb guard.
import 'package:payhere_mobilesdk_flutter/payhere_mobilesdk_flutter.dart';
import 'package:ravana_app/src/theme/app_theme.dart';
import 'package:ravana_app/src/core/api_client.dart';
import 'order_tracking_screen.dart';

// Fetch the order object — totalAmount is already stored on it
final orderProvider = FutureProvider.family.autoDispose<Map<String, dynamic>, String>((ref, orderId) async {
  final dio = ref.watch(dioProvider);
  final response = await dio.get('/orders/$orderId');
  return response.data['data'] as Map<String, dynamic>;
});

class PaymentSelectionScreen extends ConsumerStatefulWidget {
  final String orderId;
  const PaymentSelectionScreen({super.key, required this.orderId});

  @override
  ConsumerState<PaymentSelectionScreen> createState() => _PaymentSelectionScreenState();
}

class _PaymentSelectionScreenState extends ConsumerState<PaymentSelectionScreen> with TickerProviderStateMixin {
  String _selectedMethod = 'online';
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  bool _isPaying = false;
  String? _paymentError;

  final List<_PaymentOption> _options = [
    _PaymentOption(
      id: 'online',
      title: 'Credit / Debit Card',
      subtitle: 'Visa, Mastercard, Amex via PayHere',
      icon: Icons.credit_card_rounded,
      accentColor: AppTheme.primaryColor,
      bgColor: const Color(0xFFE8F5E9),
    ),
    _PaymentOption(
      id: 'cod',
      title: 'Cash on Delivery',
      subtitle: 'Pay when you receive the medicine',
      icon: Icons.payments_outlined,
      accentColor: AppTheme.secondaryColor,
      bgColor: const Color(0xFFEFEBE9),
    ),
  ];

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 0.9, end: 1.1).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  // Called when user selects Cash on Delivery
  Future<void> _processCOD() async {
    if (_isPaying) return;
    setState(() {
      _isPaying = true;
      _paymentError = null;
    });

    try {
      final dio = ref.read(dioProvider);

      await dio.put('/orders/${widget.orderId}/payment', data: {
        'paymentStatus': 'pending' // COD stays pending until delivery
      });

      await dio.put('/orders/${widget.orderId}/status', data: {
        'status': 'processing',
        'reason': 'Cash on delivery selected by patient'
      });

      if (mounted) {
        _showSuccessSheet();
      }
    } on DioException catch (e) {
      if (mounted) {
        setState(() {
          _paymentError = e.response?.data['message'] ?? 'Failed to place order. Please try again.';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _paymentError = 'An unexpected error occurred. Please try again.';
        });
      }
    } finally {
      if (mounted) setState(() => _isPaying = false);
    }
  }

  // Called when user selects PayHere online payment
  Future<void> _processPayherePayment() async {
    if (_isPaying) return;
    setState(() {
      _isPaying = true;
      _paymentError = null;
    });

    try {
      final dio = ref.read(dioProvider);

      // Step 1: Get payment parameters from backend — all credentials come from server
      final initiateResponse = await dio.post('/orders/${widget.orderId}/pay/initiate');
      final paymentParams = initiateResponse.data['data'] as Map<String, dynamic>;

      // Step 2: Launch PayHere SDK with params from server
      final completer = Completer<void>();

      if (kIsWeb) {
        // PayHere SDK is not available on web. Simulate a successful payment.
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('PayHere is only available on mobile — for testing purposes this will simulate a successful payment')),
          );
        }

        await dio.put('/orders/${widget.orderId}/payment', data: {
          'paymentStatus': 'paid'
        });

        await dio.put('/orders/${widget.orderId}/status', data: {
          'status': 'processing',
          'reason': 'Payment successful (Web Simulation)'
        });

        if (mounted) {
          _showSuccessSheet();
        }
        setState(() => _isPaying = false);
        return;
      }

      PayHere.startPayment(
        paymentParams,
        (paymentId) {
          // Payment successful — PayHere server-to-server notify will update order status
          // Navigate to tracking screen right away (optimistic)
          if (mounted) {
            _showSuccessSheet();
          }
          if (!completer.isCompleted) completer.complete();
        },
        (error) {
          // Payment error from SDK
          if (mounted) {
            setState(() {
              _paymentError = error ?? 'Payment was unsuccessful. Please try again.';
              _isPaying = false;
            });
          }
          if (!completer.isCompleted) completer.complete();
        },
        () {
          // User dismissed / cancelled the payment sheet
          if (mounted) {
            setState(() {
              _paymentError = 'Payment cancelled. You can try again.';
              _isPaying = false;
            });
          }
          if (!completer.isCompleted) completer.complete();
        },
      );

      await completer.future;
    } on DioException catch (e) {
      if (mounted) {
        setState(() {
          _paymentError = e.response?.data['message'] ?? 'Could not reach payment server. Please try again.';
          _isPaying = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _paymentError = 'An unexpected error occurred. Please try again.';
          _isPaying = false;
        });
      }
    }
  }

  void _handlePayNow() {
    HapticFeedback.heavyImpact();
    if (_selectedMethod == 'online') {
      _processPayherePayment();
    } else {
      _processCOD();
    }
  }

  @override
  Widget build(BuildContext context) {
    final orderAsync = ref.watch(orderProvider(widget.orderId));

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Secure Checkout'),
        leading: IconButton(
          onPressed: () {
            HapticFeedback.lightImpact();
            Navigator.pop(context);
          },
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppTheme.primaryColor.withOpacity(0.3)),
            ),
            child: const Row(
              children: [
                Icon(Icons.lock_rounded, color: AppTheme.primaryColor, size: 12),
                SizedBox(width: 4),
                Text(
                  'SSL Secured',
                  style: TextStyle(
                    color: AppTheme.primaryColor,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Confirm & Pay',
              style: TextStyle(
                color: AppTheme.secondaryColor,
                fontSize: 28,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.5,
              ),
            ).animate().fadeIn(duration: 400.ms).slideY(begin: -0.15, end: 0),
            const SizedBox(height: 4),
            Text(
              'Prescription verified by Standard Pharmacy',
              style: TextStyle(
                  color: AppTheme.secondaryColor.withOpacity(0.5), fontSize: 14),
            ).animate(delay: 100.ms).fadeIn(duration: 400.ms),

            const SizedBox(height: 28),

            // Error banner — shown when payment fails
            if (_paymentError != null) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.red.shade200),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline_rounded, color: Colors.red, size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        _paymentError!,
                        style: const TextStyle(color: Colors.red, fontSize: 13),
                      ),
                    ),
                    GestureDetector(
                      onTap: () => setState(() => _paymentError = null),
                      child: const Icon(Icons.close_rounded, color: Colors.red, size: 18),
                    ),
                  ],
                ),
              ).animate().fadeIn(duration: 300.ms),
              const SizedBox(height: 16),
            ],

            // Amount card — reads totalAmount directly from the order object
            orderAsync.when(
              data: (order) => _buildAmountCard(order['totalAmount'].toString()),
              loading: () => _buildShimmerAmountCard(),
              error: (err, stack) => Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.red.shade200),
                ),
                child: const Text(
                  'Could not load order details. Please go back and try again.',
                  style: TextStyle(color: Colors.red),
                ),
              ),
            ),

            const SizedBox(height: 36),

            const Text(
              'SELECT PAYMENT METHOD',
              style: TextStyle(
                color: AppTheme.secondaryColor,
                fontSize: 11,
                fontWeight: FontWeight.bold,
                letterSpacing: 2,
              ),
            ).animate(delay: 300.ms).fadeIn(duration: 400.ms),
            const SizedBox(height: 16),

            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _options.length,
              itemBuilder: (context, index) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _buildPaymentOptionCard(_options[index], index),
                );
              },
            ),

            const SizedBox(height: 36),

            // Pay button only shown when order is loaded
            orderAsync.when(
              data: (order) => _buildPayNowButton(order['totalAmount'].toString()),
              loading: () => const SizedBox.shrink(),
              error: (err, stack) => const SizedBox.shrink(),
            ),

            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildAmountCard(String total) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppTheme.secondaryColor, Color(0xFF4E342E)],
        ),
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: AppTheme.secondaryColor.withOpacity(0.2),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Total Amount Due',
                style: TextStyle(
                    color: Colors.white.withOpacity(0.55), fontSize: 13),
              ),
              const SizedBox(height: 4),
              Text(
                'Incl. delivery & taxes',
                style: TextStyle(
                    color: Colors.white.withOpacity(0.35), fontSize: 11),
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                'LKR $total',
                style: const TextStyle(
                  color: AppTheme.accentColor,
                  fontWeight: FontWeight.w900,
                  fontSize: 24,
                ),
              ),
            ],
          ),
        ],
      ),
    ).animate(delay: 200.ms).fadeIn(duration: 500.ms).slideY(begin: 0.1, end: 0);
  }

  Widget _buildShimmerAmountCard() {
    return Shimmer.fromColors(
      baseColor: AppTheme.backgroundColor.withOpacity(0.5),
      highlightColor: AppTheme.backgroundColor,
      child: Container(
        height: 100,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(28),
        ),
      ),
    );
  }

  Widget _buildPaymentOptionCard(_PaymentOption option, int index) {
    final isSelected = _selectedMethod == option.id;

    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() => _selectedMethod = option.id);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOutCubic,
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: isSelected ? option.bgColor : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? option.accentColor.withOpacity(0.5)
                : AppTheme.backgroundColor,
            width: isSelected ? 1.5 : 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: option.accentColor.withOpacity(0.12),
                    blurRadius: 20,
                    offset: const Offset(0, 6),
                  )
                ]
              : [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.03),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  )
                ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: option.bgColor,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(option.icon, color: option.accentColor, size: 22),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    option.title,
                    style: TextStyle(
                      color: isSelected ? option.accentColor : AppTheme.secondaryColor,
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    option.subtitle,
                    style: TextStyle(
                      color: AppTheme.secondaryColor.withOpacity(0.45),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSelected ? option.accentColor : Colors.transparent,
                border: Border.all(
                  color: isSelected ? option.accentColor : AppTheme.backgroundColor,
                  width: 2,
                ),
              ),
              child: isSelected
                  ? const Icon(Icons.check_rounded,
                      color: Colors.white, size: 14)
                  : null,
            ),
          ],
        ),
      ),
    )
        .animate(delay: Duration(milliseconds: 400 + index * 80))
        .fadeIn(duration: 400.ms)
        .slideX(begin: 0.08, end: 0);
  }

  Widget _buildPayNowButton(String total) {
    return AnimatedBuilder(
      animation: _pulseAnimation,
      builder: (context, child) {
        return GestureDetector(
          onTap: _isPaying ? null : _handlePayNow,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 20),
            decoration: BoxDecoration(
              color: _isPaying ? AppTheme.secondaryColor.withOpacity(0.6) : AppTheme.secondaryColor,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.secondaryColor.withOpacity(
                      _isPaying ? 0.1 : 0.2 + 0.08 * _pulseAnimation.value),
                  blurRadius: _isPaying ? 8 : 20 + 10 * _pulseAnimation.value,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (_isPaying)
                  const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                else
                  const Icon(Icons.lock_rounded, color: Colors.white, size: 18),
                const SizedBox(width: 10),
                Text(
                  _isPaying
                      ? 'Confirming your order...'
                      : 'PAY NOW — LKR $total',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 15,
                    letterSpacing: 0.3,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    ).animate(delay: 700.ms).fadeIn(duration: 500.ms).slideY(begin: 0.2, end: 0);
  }

  void _showSuccessSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      isDismissible: false,
      enableDrag: false,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.65,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(36)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 12),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppTheme.backgroundColor,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const Spacer(),
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppTheme.primaryColor,
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primaryColor.withOpacity(0.3),
                    blurRadius: 30,
                    spreadRadius: 5,
                  ),
                ],
              ),
              child: const Icon(Icons.check_rounded,
                  color: Colors.white, size: 52),
            )
                .animate()
                .scale(
                    begin: const Offset(0, 0),
                    end: const Offset(1, 1),
                    duration: 500.ms,
                    curve: Curves.elasticOut),
            const SizedBox(height: 24),
            const Text(
              'Payment Successful!',
              style: TextStyle(
                color: AppTheme.secondaryColor,
                fontSize: 26,
                fontWeight: FontWeight.w900,
              ),
            ).animate(delay: 300.ms).fadeIn(duration: 400.ms),
            const SizedBox(height: 10),
            Text(
              'Your order is now being packaged.\nTrack its progress in real-time.',
              textAlign: TextAlign.center,
              style: TextStyle(
                  color: AppTheme.secondaryColor.withOpacity(0.5),
                  fontSize: 15,
                  height: 1.6),
            ).animate(delay: 400.ms).fadeIn(duration: 400.ms),
            const Spacer(),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 40),
              child: ElevatedButton.icon(
                onPressed: () {
                  HapticFeedback.lightImpact();
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ProviderScope(
                        child: OrderTrackingScreen(orderId: widget.orderId),
                      ),
                    ),
                  );
                },
                icon: const Icon(Icons.local_shipping_rounded),
                label: const Text('VIEW ORDER TRACKING'),
              ).animate(delay: 500.ms).fadeIn(duration: 400.ms).slideY(begin: 0.2, end: 0),
            ),
          ],
        ),
      ),
    );
  }
}

class _PaymentOption {
  final String id;
  final String title;
  final String subtitle;
  final IconData icon;
  final Color accentColor;
  final Color bgColor;

  const _PaymentOption({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.accentColor,
    required this.bgColor,
  });
}
