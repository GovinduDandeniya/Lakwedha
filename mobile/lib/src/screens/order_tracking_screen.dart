import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shimmer/shimmer.dart';
import 'package:ravana_app/src/theme/app_theme.dart';
import 'package:ravana_app/src/core/api_client.dart';
import 'package:intl/intl.dart';

/// Order Tracking Screen
/// Strictly Patient-Facing.
/// Displays real-time status history with timestamps and pulsing animations.

final orderDetailsProvider = FutureProvider.family.autoDispose<Map<String, dynamic>, String>((ref, orderId) async {
  final dio = ref.watch(dioProvider);
  final response = await dio.get('/orders/$orderId');
  return response.data['data'] as Map<String, dynamic>;
});

class OrderTrackingScreen extends ConsumerStatefulWidget {
  final String orderId;
  const OrderTrackingScreen({super.key, required this.orderId});

  @override
  ConsumerState<OrderTrackingScreen> createState() => _OrderTrackingScreenState();
}

class _OrderTrackingScreenState extends ConsumerState<OrderTrackingScreen> with TickerProviderStateMixin {
  late AnimationController _pulseController;
  Timer? _pollingTimer;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat(reverse: true);

    // Poll every 20 seconds for real-time updates from pharmacists
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

  @override
  Widget build(BuildContext context) {
    final orderAsync = ref.watch(orderDetailsProvider(widget.orderId));

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('Track Order', style: TextStyle(fontWeight: FontWeight.w900, color: AppTheme.primaryColor)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: AppTheme.primaryColor),
          onPressed: () => Navigator.of(context).popUntil((route) => route.isFirst),
        ),
      ),
      body: orderAsync.when(
        data: (order) => _buildContent(order),
        loading: () => _buildShimmer(),
        error: (e, s) => _buildErrorState(),
      ),
    );
  }

  Widget _buildContent(Map<String, dynamic> order) {
    final status = order['status'] ?? 'pending';
    final paymentStatus = order['paymentStatus'] ?? 'pending';
    final paidAtStr = order['paidAt'];
    final history = order['statusHistory'] as List? ?? [];

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(orderDetailsProvider(widget.orderId)),
      color: AppTheme.primaryColor,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Info
            _buildOrderInfoCard(order, paymentStatus, paidAtStr),
            
            const SizedBox(height: 48),
            const Text('ORDER TIMELINE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 2, color: Colors.grey)),
            const SizedBox(height: 24),

            // Vertical Timeline
            ..._buildTimeline(status, history),
            
            const SizedBox(height: 48),
            _buildSupportSection(),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderInfoCard(Map<String, dynamic> order, String paymentStatus, dynamic paidAt) {
    Color badgeColor = Colors.orange;
    String badgeText = paymentStatus.toUpperCase();

    if (paymentStatus == 'paid') {
      badgeColor = AppTheme.primaryColor;
    } else if (paymentStatus == 'failed') {
      badgeColor = Colors.red;
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 40, offset: const Offset(0, 10)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('#${widget.orderId.substring(widget.orderId.length - 8).toUpperCase()}', 
                   style: const TextStyle(fontWeight: FontWeight.w900, color: Colors.grey, fontSize: 12)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(color: badgeColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12), border: Border.all(color: badgeColor.withValues(alpha: 0.3))),
                child: Text(badgeText, style: TextStyle(color: badgeColor, fontSize: 10, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Text('Items Dispensed:', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
          Text('${(order['medicines'] as List?)?.length ?? 0} Pharmaceutical Items', 
               style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppTheme.primaryColor)),
          
          if (paidAt != null) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.verified, color: AppTheme.accentColor, size: 14),
                const SizedBox(width: 4),
                Text('Paid on ${DateFormat('MMM dd, hh:mm a').format(DateTime.parse(paidAt.toString()))}', 
                     style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.accentColor)),
              ],
            ),
          ],
        ],
      ),
    );
  }

  List<Widget> _buildTimeline(String currentStatus, List history) {
    final stages = [
      {'key': 'approved', 'label': 'Order Approved', 'desc': 'Pharmacist verified prescription'},
      {'key': 'processing', 'label': 'Packaging', 'desc': 'Medicines being prepared'},
      {'key': 'shipped', 'label': 'On the Way', 'desc': 'Rider out for delivery'},
      {'key': 'completed', 'label': 'Delivered', 'desc': 'Handed over successfully'},
    ];

    int currentIndex = stages.indexWhere((s) => s['key'] == currentStatus);
    
    return List.generate(stages.length, (i) {
      final stage = stages[i];
      final isLast = i == stages.length - 1;
      final isCompleted = i <= currentIndex;
      final isCurrent = i == currentIndex;
      
      // Try to find timestamp in history
      final historyEntry = history.firstWhere((h) => h['to'] == stage['key'], orElse: () => null);
      String timeStr = '--:--';
      if (historyEntry != null) {
        timeStr = DateFormat('hh:mm a').format(DateTime.parse(historyEntry['changedAt'].toString()));
      }

      return Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Marker
          Column(
            children: [
              if (isCurrent)
                ScaleTransition(
                  scale: Tween(begin: 1.0, end: 1.2).animate(CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut)),
                  child: Container(
                    width: 24, height: 24, 
                    decoration: const BoxDecoration(color: AppTheme.primaryColor, shape: BoxShape.circle),
                    child: const Icon(Icons.sync, color: Colors.white, size: 12),
                  ),
                )
              else
                Container(
                  width: 20, height: 20,
                  decoration: BoxDecoration(
                    color: isCompleted ? AppTheme.primaryColor : Colors.grey[200],
                    shape: BoxShape.circle,
                  ),
                  child: isCompleted ? const Icon(Icons.check, color: Colors.white, size: 12) : null,
                ),
              if (!isLast)
                Container(width: 2, height: 60, color: isCompleted ? AppTheme.primaryColor : Colors.grey[200]),
            ],
          ),
          const SizedBox(width: 24),
          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(stage['label']!, style: TextStyle(fontWeight: FontWeight.bold, color: isCompleted ? AppTheme.primaryColor : Colors.grey)),
                    Text(timeStr, style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 4),
                Text(stage['desc']!, style: TextStyle(fontSize: 12, color: isCompleted ? Colors.black54 : Colors.grey[400])),
              ],
            ),
          ),
        ],
      );
    });
  }

  Widget _buildSupportSection() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(color: AppTheme.secondaryColor.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(24), border: Border.all(color: AppTheme.secondaryColor.withValues(alpha: 0.1))),
      child: const Row(
        children: [
          Icon(Icons.headset_mic_outlined, color: AppTheme.secondaryColor),
          SizedBox(width: 16),
          Expanded(child: Text('Need assistance with your delivery?\nContact our support anytime.', style: TextStyle(fontSize: 13, color: AppTheme.primaryColor, fontWeight: FontWeight.w600))),
        ],
      ),
    );
  }

  Widget _buildShimmer() {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Container(width: double.infinity, height: 140, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(32))),
            const SizedBox(height: 48),
            ...List.generate(4, (i) => Padding(
              padding: const EdgeInsets.only(bottom: 24),
              child: Row(children: [
                Container(width: 24, height: 24, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle)),
                const SizedBox(width: 24),
                Expanded(child: Container(height: 40, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8)))),
              ]),
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.cloud_off, size: 64, color: Colors.grey),
          const SizedBox(height: 16),
          const Text('Connection lost to health services.', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => ref.invalidate(orderDetailsProvider(widget.orderId)),
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryColor, foregroundColor: Colors.white),
            child: const Text('RETRY SYNC'),
          ),
        ],
      ),
    );
  }
}
