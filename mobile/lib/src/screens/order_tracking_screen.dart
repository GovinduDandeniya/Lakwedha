import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shimmer/shimmer.dart';
import 'package:ravana_app/src/theme/app_theme.dart';
import 'package:ravana_app/src/core/api_client.dart';

final orderDetailsProvider = FutureProvider.family.autoDispose<Map<String, dynamic>, String>((ref, orderId) async {
  final dio = ref.watch(dioProvider);
  final response = await dio.get('/orders/$orderId');
  return response.data['data'] != null ? response.data['data'] as Map<String, dynamic> : response.data as Map<String, dynamic>;
});

class OrderTrackingScreen extends ConsumerStatefulWidget {
  final String orderId;
  const OrderTrackingScreen({super.key, required this.orderId});

  @override
  ConsumerState<OrderTrackingScreen> createState() => _OrderTrackingScreenState();
}

class _OrderTrackingScreenState extends ConsumerState<OrderTrackingScreen> with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  Timer? _pollingTimer;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 0.8, end: 1.2).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    // Poll every 20 seconds
    _pollingTimer = Timer.periodic(const Duration(seconds: 20), (_) {
      ref.invalidate(orderDetailsProvider(widget.orderId));
    });
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    _pulseController.dispose();
    super.dispose();
  }

  // Helper to map DB status to steps
  List<_TrackingStep> _generateSteps(Map<String, dynamic> order) {
    final status = order['status'] as String? ?? 'pending';
    final history = order['statusHistory'] as List<dynamic>? ?? [];

    // Helper to extract time from history
    String getTime(String state) {
      final record = history.cast<Map<String, dynamic>>().lastWhere(
        (h) => h['to'] == state,
        orElse: () => <String, dynamic>{},
      );
      if (record.isEmpty) return '--:--';
      final date = DateTime.parse(record['changedAt'].toString());
      return "${date.hour}:${date.minute.toString().padLeft(2, '0')}";
    }

    final states = ['approved', 'processing', 'shipped', 'completed'];
    final currentIndex = states.indexOf(status);

    return [
      _TrackingStep(
        icon: Icons.check_circle_rounded,
        title: 'Prescription Approved',
        subtitle: 'Pharmacist verified your request',
        time: getTime('approved'),
        isCompleted: currentIndex >= 0,
        isCurrent: currentIndex == 0,
      ),
      _TrackingStep(
        icon: Icons.inventory_2_rounded,
        title: 'Packaging Medicines',
        subtitle: 'Ensuring correct dosage and quality',
        time: currentIndex == 1 ? 'In Progress' : (currentIndex > 1 ? getTime('processing') : '--:--'),
        isCompleted: currentIndex >= 1,
        isCurrent: currentIndex == 1,
      ),
      _TrackingStep(
        icon: Icons.local_shipping_rounded,
        title: 'Out for Delivery',
        subtitle: 'Rider is on the way to your address',
        time: currentIndex == 2 ? 'In Progress' : (currentIndex > 2 ? getTime('shipped') : '--:--'),
        isCompleted: currentIndex >= 2,
        isCurrent: currentIndex == 2,
      ),
      _TrackingStep(
        icon: Icons.home_rounded,
        title: 'Order Delivered',
        subtitle: 'Successfully handed over',
        time: currentIndex == 3 ? getTime('completed') : '--:--',
        isCompleted: currentIndex >= 3,
        isCurrent: currentIndex == 3,
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final orderAsync = ref.watch(orderDetailsProvider(widget.orderId));

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Order Pipeline'),
        leading: IconButton(
          onPressed: () {
            HapticFeedback.lightImpact();
            // Using pushAndRemoveUntil to prevent going back to checkout
            Navigator.of(context).popUntil((route) => route.isFirst);
          },
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
        ),
        actions: [
          IconButton(
            onPressed: () => ref.invalidate(orderDetailsProvider(widget.orderId)),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: orderAsync.when(
        data: (order) {
          final steps = _generateSteps(order);
          final total = order['totalAmount']?.toString() ?? '0.00';
          final shortId = order['_id']?.toString().substring(0, 8) ?? 'UNKNOWN';
          final niceStatus = (order['status'] as String? ?? 'Pending').toUpperCase();

          return SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                _buildOrderSummaryCard(shortId, total, niceStatus),
                const SizedBox(height: 36),

                const Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'TRACKING STATUS',
                    style: TextStyle(
                      color: AppTheme.secondaryColor,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 2,
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: steps.length,
                  itemBuilder: (context, index) {
                    return _buildStep(steps[index], index, index == steps.length - 1);
                  },
                ),

                const SizedBox(height: 36),
                _buildSupportCard(),
                const SizedBox(height: 40),
              ],
            ),
          );
        },
        loading: () => _buildShimmerLoading(),
        error: (err, stack) => Center(child: Text('Error: $err', style: const TextStyle(color: Colors.red))),
      ),
    );
  }

  Widget _buildOrderSummaryCard(String id, String total, String status) {
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
            color: AppTheme.secondaryColor.withValues(alpha: 0.2),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Order ID',
                      style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.5), fontSize: 12)),
                  Text(
                    '#ORD-$id',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 18,
                    ),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('Total',
                      style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.5), fontSize: 12)),
                  Text(
                    'LKR $total',
                    style: const TextStyle(
                      color: AppTheme.accentColor,
                      fontWeight: FontWeight.w900,
                      fontSize: 20,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          Divider(color: Colors.white.withValues(alpha: 0.12)),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(Icons.local_hospital_rounded,
                  color: Colors.white.withValues(alpha: 0.5), size: 16),
              const SizedBox(width: 8),
              Text(
                'Standard Ayurvedic Dispensary',
                style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.7), fontSize: 13),
              ),
              const Spacer(),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                decoration: BoxDecoration(
                  color: AppTheme.accentColor.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.accentColor.withValues(alpha: 0.4)),
                ),
                child: Text(
                  status,
                  style: const TextStyle(
                    color: AppTheme.accentColor,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(duration: 500.ms).slideY(begin: -0.1, end: 0);
  }

  Widget _buildStep(_TrackingStep step, int index, bool isLast) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 52,
          child: Column(
            children: [
              step.isCurrent
                  ? AnimatedBuilder(
                      animation: _pulseAnimation,
                      builder: (context, child) {
                        return Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppTheme.accentColor,
                            boxShadow: [
                              BoxShadow(
                                color: AppTheme.accentColor.withValues(alpha: 
                                    0.35 * _pulseAnimation.value),
                                blurRadius: 20 * _pulseAnimation.value,
                                spreadRadius: 3 * _pulseAnimation.value,
                              ),
                            ],
                          ),
                          child: Icon(step.icon,
                              color: Colors.white, size: 20),
                        );
                      },
                    )
                  : Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: step.isCompleted
                            ? AppTheme.primaryColor
                            : AppTheme.backgroundColor.withValues(alpha: 0.5),
                        boxShadow: step.isCompleted
                            ? [
                                BoxShadow(
                                  color: AppTheme.primaryColor.withValues(alpha: 0.3),
                                  blurRadius: 10,
                                )
                              ]
                            : [],
                      ),
                      child: Icon(
                        step.icon,
                        color: step.isCompleted
                            ? Colors.white
                            : AppTheme.secondaryColor.withValues(alpha: 0.4),
                        size: 20,
                      ),
                    ),
              if (!isLast)
                Container(
                  width: 2,
                  height: 56,
                  margin: const EdgeInsets.symmetric(vertical: 4),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: step.isCompleted
                          ? [AppTheme.primaryColor, AppTheme.primaryColor.withValues(alpha: 0.2)]
                          : [
                              AppTheme.backgroundColor.withValues(alpha: 0.5),
                              Colors.transparent
                            ],
                    ),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      step.title,
                      style: TextStyle(
                        color: step.isCompleted || step.isCurrent
                            ? AppTheme.secondaryColor
                            : AppTheme.secondaryColor.withValues(alpha: 0.4),
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                      ),
                    ),
                    Text(
                      step.time,
                      style: TextStyle(
                        color: step.isCurrent
                            ? AppTheme.accentColor
                            : AppTheme.secondaryColor.withValues(alpha: 0.5),
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  step.subtitle,
                  style: TextStyle(
                    color: AppTheme.secondaryColor.withValues(alpha: 
                        step.isCompleted || step.isCurrent ? 0.5 : 0.25),
                    fontSize: 13,
                  ),
                ),
                SizedBox(height: isLast ? 0 : 24),
              ],
            ),
          ),
        ),
      ],
    )
        .animate(delay: Duration(milliseconds: 300 + index * 150))
        .fadeIn(duration: 500.ms)
        .slideX(begin: -0.08, end: 0);
  }

  Widget _buildShimmerLoading() {
    return Shimmer.fromColors(
      baseColor: AppTheme.backgroundColor.withValues(alpha: 0.5),
      highlightColor: AppTheme.backgroundColor,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Container(
              height: 140,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(28),
              ),
            ),
            const SizedBox(height: 60),
            ...List.generate(
              4,
              (index) => Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Container(
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ],
              ).animate().fadeIn(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSupportCard() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.backgroundColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 12,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.support_agent_rounded,
                color: AppTheme.primaryColor, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Text(
              'Need help? Our pharmaceutical support team is available 24/7.',
              style: TextStyle(
                  color: AppTheme.secondaryColor.withValues(alpha: 0.6), fontSize: 13),
            ),
          ),
        ],
      ),
    ).animate(delay: 1000.ms).fadeIn(duration: 400.ms);
  }
}

class _TrackingStep {
  final IconData icon;
  final String title;
  final String subtitle;
  final String time;
  final bool isCompleted;
  final bool isCurrent;

  const _TrackingStep({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.time,
    required this.isCompleted,
    required this.isCurrent,
  });
}
