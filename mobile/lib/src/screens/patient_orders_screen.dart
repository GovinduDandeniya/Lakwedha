import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shimmer/shimmer.dart';
import 'package:ravana_app/src/core/api_client.dart';
import 'package:ravana_app/src/theme/app_theme.dart';
import 'payment_selection_screen.dart';

/// Patient Orders Screen — shows all orders with live status.
/// Patients see status badges and can pay for approved unpaid orders.

final patientOrdersProvider =
    FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final dio = ref.watch(dioProvider);
  final response = await dio.get('/api/v1/orders');
  return response.data['data'] as List<dynamic>;
});

class PatientOrdersScreen extends ConsumerWidget {
  const PatientOrdersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ordersAsync = ref.watch(patientOrdersProvider);

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          'My Orders',
          style: TextStyle(
              fontWeight: FontWeight.w900, color: AppTheme.primaryColor),
        ),
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.arrow_back_ios_new_rounded,
              color: AppTheme.primaryColor),
        ),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            onPressed: () {
              HapticFeedback.lightImpact();
              ref.invalidate(patientOrdersProvider);
            },
            icon: const Icon(Icons.refresh_rounded,
                color: AppTheme.primaryColor),
          ),
        ],
      ),
      body: ordersAsync.when(
        data: (orders) {
          if (orders.isEmpty) return _buildEmptyState();
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(patientOrdersProvider),
            color: AppTheme.primaryColor,
            child: ListView.separated(
              physics: const AlwaysScrollableScrollPhysics(
                  parent: BouncingScrollPhysics()),
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
              itemCount: orders.length,
              separatorBuilder: (_, __) => const SizedBox(height: 14),
              itemBuilder: (context, index) {
                final order = orders[index] as Map<String, dynamic>;
                return _OrderCard(order: order, index: index);
              },
            ),
          );
        },
        loading: () => _buildShimmer(),
        error: (err, _) => _buildErrorState(ref, err),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withValues(alpha: 0.08),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.receipt_long_rounded,
                size: 60, color: AppTheme.primaryColor),
          ),
          const SizedBox(height: 24),
          const Text(
            'No Orders Yet',
            style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w900,
                color: AppTheme.secondaryColor),
          ),
          const SizedBox(height: 8),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 48),
            child: Text(
              'When a pharmacy approves your prescription, your order will appear here.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey, fontSize: 14, height: 1.5),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 500.ms).scale(begin: const Offset(0.9, 0.9));
  }

  Widget _buildShimmer() {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade200,
      highlightColor: Colors.grey.shade100,
      child: ListView.builder(
        padding: const EdgeInsets.all(20),
        itemCount: 4,
        itemBuilder: (_, __) => Container(
          margin: const EdgeInsets.only(bottom: 14),
          height: 130,
          decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24)),
        ),
      ),
    );
  }

  Widget _buildErrorState(WidgetRef ref, Object err) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.wifi_off_rounded,
                color: Colors.redAccent, size: 52),
            const SizedBox(height: 20),
            const Text('Could not load your orders',
                style: TextStyle(
                    color: AppTheme.secondaryColor,
                    fontSize: 18,
                    fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(err.toString(),
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 12, color: Colors.grey)),
            const SizedBox(height: 28),
            ElevatedButton.icon(
              onPressed: () => ref.invalidate(patientOrdersProvider),
              icon: const Icon(Icons.refresh),
              label: const Text('RETRY'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                    horizontal: 32, vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OrderCard extends ConsumerWidget {
  final Map<String, dynamic> order;
  final int index;

  const _OrderCard({required this.order, required this.index});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status =
        (order['status'] as String? ?? 'pending').toLowerCase();
    final paymentStatus =
        (order['paymentStatus'] as String? ?? 'pending').toLowerCase();
    final totalAmount = order['totalAmount'] as num? ?? 0;
    final createdAt = order['createdAt'] as String? ?? '';

    final isAwaitingPayment =
        status == 'approved' && paymentStatus == 'pending';

    final statusColor = _statusColor(status);
    final payColor = _paymentColor(paymentStatus);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top row: date + status badge
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Prescription Order',
                        style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.secondaryColor)),
                    if (createdAt.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        _formatDate(createdAt),
                        style: TextStyle(
                            fontSize: 11, color: Colors.grey.shade500),
                      ),
                    ],
                  ],
                ),
                _badge(status.toUpperCase(), statusColor),
              ],
            ),

            const SizedBox(height: 14),
            const Divider(height: 1, color: Color(0xFFF0F0F0)),
            const SizedBox(height: 14),

            // Bottom row: amount + payment status + pay button
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'LKR ${totalAmount.toStringAsFixed(2)}',
                        style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            color: AppTheme.primaryColor),
                      ),
                      const SizedBox(height: 4),
                      _badge(
                        paymentStatus == 'paid'
                            ? '✓ PAID'
                            : paymentStatus == 'failed'
                                ? '✗ FAILED'
                                : 'PAYMENT PENDING',
                        payColor,
                        small: true,
                      ),
                    ],
                  ),
                ),
                if (isAwaitingPayment)
                  ElevatedButton(
                    onPressed: () {
                      HapticFeedback.heavyImpact();
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => PaymentSelectionScreen(
                            orderId: order['_id'] as String,
                          ),
                        ),
                      ).then((_) {
                        // Refresh list when returning from payment
                        ref.invalidate(patientOrdersProvider);
                      });
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.accentColor,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14)),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 22, vertical: 14),
                    ),
                    child: const Text('Pay Now',
                        style: TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w800)),
                  ),
              ],
            ),
          ],
        ),
      ),
    ).animate(
        delay: Duration(milliseconds: 60 * index)
    ).fadeIn().slideY(
        begin: 0.06,
        end: 0,
        duration: 300.ms,
        curve: Curves.easeOut);
  }

  Widget _badge(String label, Color color, {bool small = false}) {
    return Container(
      padding: EdgeInsets.symmetric(
          horizontal: small ? 8 : 10, vertical: small ? 3 : 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
            color: color,
            fontSize: small ? 9 : 10,
            fontWeight: FontWeight.w900,
            letterSpacing: 0.4),
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'approved':
        return Colors.orange;
      case 'processing':
        return Colors.blue;
      case 'shipped':
        return Colors.purple;
      case 'completed':
        return AppTheme.primaryColor;
      case 'cancelled':
      case 'rejected':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Color _paymentColor(String status) {
    switch (status) {
      case 'paid':
        return AppTheme.primaryColor;
      case 'failed':
        return Colors.red;
      default:
        return Colors.orange;
    }
  }

  String _formatDate(String iso) {
    try {
      final d = DateTime.parse(iso);
      return '${d.day}/${d.month}/${d.year}';
    } catch (_) {
      return iso;
    }
  }
}
