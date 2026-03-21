import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shimmer/shimmer.dart';
import 'package:ravana_app/src/theme/app_theme.dart';
import 'package:ravana_app/src/core/api_client.dart';
import 'package:ravana_app/src/core/payment_service.dart';
import 'order_tracking_screen.dart';

/// Payment Selection Screen
/// Strictly Patient-Facing.
/// Orchestrates the checkout flow.

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

class _PaymentSelectionScreenState extends ConsumerState<PaymentSelectionScreen> {
  String _selectedMethod = 'card';
  bool _isProcessing = false;
  String? _errorMessage;

  Future<void> _handleCardFlow() async {
    setState(() {
      _isProcessing = true;
      _errorMessage = null;
    });

    final paymentService = ref.read(paymentServiceProvider);

    await paymentService.processOrderPayment(
      orderId: widget.orderId,
      onSuccess: () {
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => OrderTrackingScreen(orderId: widget.orderId)),
          );
        }
      },
      onError: (err) {
        setState(() => _errorMessage = err);
      },
    );

    if (mounted) setState(() => _isProcessing = false);
  }

  Future<void> _handleCODFlow() async {
     setState(() {
      _isProcessing = true;
      _errorMessage = null;
    });

    final paymentService = ref.read(paymentServiceProvider);

    await paymentService.processCODPayment(
      orderId: widget.orderId,
      onSuccess: () {
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => OrderTrackingScreen(orderId: widget.orderId)),
          );
        }
      },
      onError: (err) {
        setState(() => _errorMessage = err);
      },
    );

    if (mounted) setState(() => _isProcessing = false);
  }

  @override
  Widget build(BuildContext context) {
    final orderAsync = ref.watch(orderProvider(widget.orderId));

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('Checkout', style: TextStyle(fontWeight: FontWeight.w900, color: AppTheme.primaryColor)),
        centerTitle: true,
      ),
      body: orderAsync.when(
        data: (order) => _buildContent(order),
        loading: () => _buildLoading(),
        error: (e, s) => Center(child: Text('Error loading order: $e')),
      ),
    );
  }

  Widget _buildLoading() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Shimmer.fromColors(
            baseColor: Colors.grey[300]!,
            highlightColor: Colors.grey[100]!,
            child: Container(width: 200, height: 20, color: Colors.white),
          ),
          const SizedBox(height: 20),
          const CircularProgressIndicator(color: AppTheme.primaryColor),
        ],
      ),
    );
  }

  Widget _buildContent(Map<String, dynamic> order) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Secure Payment', style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: AppTheme.primaryColor)),
          const Text('Complete your Ayurvedic order safely.', style: TextStyle(color: Colors.grey)),
          
          const SizedBox(height: 32),

          // Amount Card
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: AppTheme.primaryColor,
              borderRadius: BorderRadius.circular(32),
              boxShadow: [
                BoxShadow(color: AppTheme.primaryColor.withValues(alpha: 0.3), blurRadius: 20, offset: const Offset(0, 10)),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                     Text('Total to Pay', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
                     SizedBox(height: 4),
                     Text('LKR', style: TextStyle(color: AppTheme.secondaryColor, fontWeight: FontWeight.bold)),
                  ],
                ),
                Text(
                  '${order['totalAmount']}',
                  style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w900),
                ),
              ],
            ),
          ).animate().slideY(begin: 0.2, end: 0, duration: 600.ms, curve: Curves.easeOut),

          const SizedBox(height: 48),

          if (_errorMessage != null) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.red[50], borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.red[200]!)),
              child: Row(
                children: [
                  const Icon(Icons.error_outline, color: Colors.red),
                  const SizedBox(width: 12),
                  Expanded(child: Text(_errorMessage!, style: const TextStyle(color: Colors.red, fontSize: 12))),
                ],
              ),
            ).animate().shake(),
            const SizedBox(height: 24),
          ],

          const Text('PAYMENT METHOD', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 2, color: Colors.grey)),
          const SizedBox(height: 16),

          _MethodTile(
            id: 'card', 
            icon: Icons.credit_card, 
            label: 'Credit / Debit Card', 
            selected: _selectedMethod == 'card', 
            onTap: () => setState(() => _selectedMethod = 'card')
          ),
          const SizedBox(height: 12),
          _MethodTile(
            id: 'cod', 
            icon: Icons.delivery_dining, 
            label: 'Cash on Delivery', 
            selected: _selectedMethod == 'cod', 
            onTap: () => setState(() => _selectedMethod = 'cod')
          ),

          const SizedBox(height: 48),

          SizedBox(
            width: double.infinity,
            height: 64,
            child: ElevatedButton(
              onPressed: _isProcessing ? null : () {
                HapticFeedback.heavyImpact();
                if (_selectedMethod == 'card') {
                  _handleCardFlow();
                } else {
                  _handleCODFlow();
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.secondaryColor,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                elevation: 10,
                shadowColor: AppTheme.secondaryColor.withValues(alpha: 0.4),
              ),
              child: _isProcessing 
                ? const CircularProgressIndicator(color: Colors.white)
                : const Text('CONFIRM PAYMENT', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1)),
            ),
          ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.1, end: 0),
        ],
      ),
    );
  }
}

class _MethodTile extends StatelessWidget {
  final String id;
  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _MethodTile({required this.id, required this.icon, required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        decoration: BoxDecoration(
          color: selected ? AppTheme.primaryColor.withValues(alpha: 0.05) : Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: selected ? AppTheme.primaryColor : Colors.grey[200]!, width: 2),
        ),
        child: Row(
          children: [
            Icon(icon, color: selected ? AppTheme.primaryColor : Colors.grey),
            const SizedBox(width: 16),
            Text(label, style: TextStyle(fontWeight: FontWeight.bold, color: selected ? AppTheme.primaryColor : Colors.grey[700])),
            const Spacer(),
            if (selected) const Icon(Icons.check_circle, color: AppTheme.primaryColor),
          ],
        ),
      ),
    );
  }
}
