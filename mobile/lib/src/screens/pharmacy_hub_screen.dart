import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shimmer/shimmer.dart';
import 'package:ravana_app/src/theme/app_theme.dart';
import 'package:ravana_app/src/core/api_client.dart';
import 'package:ravana_app/src/screens/payment_selection_screen.dart';
import 'package:ravana_app/src/screens/order_tracking_screen.dart';

final prescriptionsProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final dio = ref.watch(dioProvider);
  final response = await dio.get('/pharmacy/prescriptions');
  return response.data['data'] as List<dynamic>;
});

class PharmacyHubScreen extends ConsumerStatefulWidget {
  const PharmacyHubScreen({super.key});

  @override
  ConsumerState<PharmacyHubScreen> createState() => _PharmacyHubScreenState();
}

class _PharmacyHubScreenState extends ConsumerState<PharmacyHubScreen> with TickerProviderStateMixin {
  final ScrollController _scrollController = ScrollController();
  Timer? _pollingTimer;

  @override
  void initState() {
    super.initState();
    // 30-second polling for new requests
    _pollingTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      ref.invalidate(prescriptionsProvider);
    });
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _reviewPrescription(String id, String status, {String? reason, List<Map<String, dynamic>>? medicines}) async {
    try {
      final dio = ref.read(dioProvider);

      final payload = {
        'status': status,
        if (reason != null) 'rejectionReason': reason,
        if (medicines != null) 'medicines': medicines,
      };

      await dio.put('/pharmacy/prescriptions/$id/review', data: payload);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Prescription $status successfully!'),
            backgroundColor: status == 'approved' ? AppTheme.primaryColor : Colors.red,
          )
        );
      }
      ref.invalidate(prescriptionsProvider);
    } on DioException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.response?.data['message'] ?? 'Error reviewing prescription'),
            backgroundColor: Colors.red,
          )
        );
      }
    }
  }

  void _showRejectModal(String id) {
    final reasonController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reject Prescription'),
        content: TextField(
          controller: reasonController,
          decoration: const InputDecoration(
            labelText: 'Reason (min. 10 chars)',
            border: OutlineInputBorder(),
          ),
          maxLength: 100,
          maxLines: 3,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () {
              if (reasonController.text.length < 10) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Reason must be at least 10 characters')),
                );
                return;
              }
              Navigator.pop(context);
              _reviewPrescription(id, 'rejected', reason: reasonController.text);
            },
            child: const Text('Reject', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showApproveModal(String id) {
    final nameController = TextEditingController(text: 'Amoxicillin');
    final qtyController = TextEditingController(text: '10');
    final priceController = TextEditingController(text: '25');

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Approve & Add Medicines'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Medicine Name')),
            TextField(controller: qtyController, decoration: const InputDecoration(labelText: 'Quantity'), keyboardType: TextInputType.number),
            TextField(controller: priceController, decoration: const InputDecoration(labelText: 'Unit Price (LKR)'), keyboardType: TextInputType.number),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryColor),
            onPressed: () {
              final medicines = [
                {
                  'name': nameController.text,
                  'qty': int.tryParse(qtyController.text) ?? 1,
                  'unitPrice': double.tryParse(priceController.text) ?? 0,
                }
              ];
              Navigator.pop(context);
              _reviewPrescription(id, 'approved', medicines: medicines);
            },
            child: const Text('Approve', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }



  @override
  Widget build(BuildContext context) {
    final prescriptionsAsync = ref.watch(prescriptionsProvider);

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: CustomScrollView(
        controller: _scrollController,
        physics: const BouncingScrollPhysics(),
        slivers: [
          // ── Expanding App Bar ──────────────────────────────────────────
          SliverAppBar(
            expandedHeight: 220,
            pinned: true,
            stretch: true,
            backgroundColor: AppTheme.secondaryColor,
            leading: IconButton(
              onPressed: () {
                HapticFeedback.lightImpact();
                Navigator.pop(context);
              },
              icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white),
            ),
            flexibleSpace: FlexibleSpaceBar(
              stretchModes: const [
                StretchMode.blurBackground,
                StretchMode.zoomBackground
              ],
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          AppTheme.secondaryColor,
                          Color(0xFF4E342E),
                          AppTheme.primaryColor,
                        ],
                      ),
                    ),
                  ),
                  Positioned(
                    top: -40,
                    right: -40,
                    child: Container(
                      width: 200,
                      height: 200,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            AppTheme.accentColor.withValues(alpha: 0.15),
                            Colors.transparent,
                          ],
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 24,
                    left: 20,
                    right: 20,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                         Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.accentColor.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                                color: AppTheme.accentColor.withValues(alpha: 0.4)),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.circle,
                                  color: AppTheme.accentColor, size: 8),
                              SizedBox(width: 6),
                              Text(
                                'LIVE DASHBOARD',
                                style: TextStyle(
                                  color: AppTheme.accentColor,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 1.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 10),
                        const Text(
                          'Pharmacy\nOperational Hub',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 28,
                            fontWeight: FontWeight.w900,
                            height: 1.15,
                            letterSpacing: -0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Stats Grid ─────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "TODAY'S OVERVIEW",
                    style: TextStyle(
                      color: AppTheme.secondaryColor,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.5,
                    ),
                  ),
                  const SizedBox(height: 14),
                  prescriptionsAsync.when(
                    data: (prescriptions) {
                      final pendingCount = prescriptions.where((p) => p['pharmacyStatus'] == 'pending').length;
                      final approvedCount = prescriptions.where((p) => p['pharmacyStatus'] == 'approved').length;
                      return _buildStatsGrid(pendingCount, approvedCount);
                    },
                    loading: () => _buildShimmerStats(),
                    error: (err, stack) => const Text('Failed to load stats', style: TextStyle(color: Colors.red)),
                  ),
                ],
              ),
            ),
          ),

          // ── Incoming Requests Header ────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 32, 20, 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'All Prescriptions',
                    style: TextStyle(
                      color: AppTheme.secondaryColor,
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.refresh, color: AppTheme.primaryColor),
                    onPressed: () => ref.invalidate(prescriptionsProvider),
                  )
                ],
              ),
            ),
          ),

          // ── Request List ────────────────────────────────────────────────
          prescriptionsAsync.when(
            data: (prescriptions) {
              final allPrescriptions = prescriptions.toList();

              if (allPrescriptions.isEmpty) {
                return SliverToBoxAdapter(
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.all(40.0),
                      child: Column(
                        children: [
                          Icon(Icons.check_circle_outline, size: 60, color: AppTheme.secondaryColor.withValues(alpha: 0.3)),
                          const SizedBox(height: 16),
                          Text(
                            'All caught up!',
                            style: TextStyle(color: AppTheme.secondaryColor.withValues(alpha: 0.5), fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'No prescriptions found.',
                            style: TextStyle(color: AppTheme.secondaryColor.withValues(alpha: 0.4)),
                          )
                        ],
                      ),
                    ),
                  ),
                );
              }

              return SliverList.builder(
                itemCount: allPrescriptions.length,
                itemBuilder: (context, index) {
                  final req = allPrescriptions[index];
                  return Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                    child: _buildRealRequestCard(req, index),
                  );
                },
              );
            },
            loading: () => SliverToBoxAdapter(child: _buildShimmerList()),
            error: (err, stack) => SliverToBoxAdapter(
              child: Center(child: Text('Error loading requests: $err', style: const TextStyle(color: Colors.red))),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 40)),
        ],
      ),
    );
  }

  Widget _buildRealRequestCard(Map<String, dynamic> request, int index) {
    final date = DateTime.parse(request['createdAt'].toString());
    final timeStr = "${date.day}/${date.month}  ${date.hour}:${date.minute.toString().padLeft(2, '0')}";
    final status = request['pharmacyStatus'] as String? ?? 'pending';
    final String? orderId = request['orderId'];
    final String? orderStatus = request['orderStatus'];
    final String? paymentStatus = request['paymentStatus'];

    Color statusColor;
    if (status == 'approved') {
      statusColor = AppTheme.primaryColor;
    } else if (status == 'rejected') {
      statusColor = Colors.red;
    } else {
      statusColor = AppTheme.accentColor;
    }

    return GestureDetector(
      onTap: () {
        if (status == 'rejected') {
          HapticFeedback.lightImpact();
          showDialog(
            context: context,
            builder: (context) => AlertDialog(
              title: const Text('Rejection Reason'),
              content: Text(request['rejectionReason'] ?? 'No reason provided.'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Close'),
                ),
              ],
            ),
          );
        } else if (status == 'approved' && orderId != null) {
          HapticFeedback.selectionClick();
          if (paymentStatus == 'paid' || (orderStatus != null && orderStatus != 'approved' && orderStatus != 'pending')) {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => OrderTrackingScreen(orderId: orderId)),
            );
          } else {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => PaymentSelectionScreen(orderId: orderId)),
            );
          }
        }
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppTheme.backgroundColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(Icons.description_outlined, color: statusColor, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      request['patientName'] ?? 'Guest',
                      style: const TextStyle(
                        color: AppTheme.secondaryColor,
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'ID: ${request['_id'].toString().substring(0, 8)} • $timeStr',
                      style: TextStyle(
                        color: AppTheme.secondaryColor.withValues(alpha: 0.5),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                ),
                child: Text(
                  status.toUpperCase(),
                  style: TextStyle(
                    color: statusColor,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),

          if (status == 'pending') ...[
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Divider(height: 1),
            ),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _showRejectModal(request['_id']),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.red,
                      side: const BorderSide(color: Colors.red),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text('Reject'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => _showApproveModal(request['_id']),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text('Approve'),
                  ),
                ),
              ],
            )
          ]
          else if (status == 'approved' && orderId != null) ...[
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Divider(height: 1),
            ),
            if (paymentStatus == 'paid' || (orderStatus != null && orderStatus != 'approved' && orderStatus != 'pending'))
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    HapticFeedback.selectionClick();
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => OrderTrackingScreen(orderId: orderId),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  icon: const Icon(Icons.local_shipping_rounded, size: 18),
                  label: const Text('Track Order', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              )
            else
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    HapticFeedback.selectionClick();
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => PaymentSelectionScreen(orderId: orderId),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.secondaryColor,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  icon: const Icon(Icons.payment_rounded, size: 18),
                  label: const Text('Proceed to Payment', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              )
          ]
          else if (status == 'rejected') ...[
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Divider(height: 1),
            ),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () {
                  HapticFeedback.lightImpact();
                  showDialog(
                    context: context,
                    builder: (context) => AlertDialog(
                      title: const Text('Rejection Reason'),
                      content: Text(request['rejectionReason'] ?? 'No reason provided.'),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(context),
                          child: const Text('Close'),
                        ),
                      ],
                    ),
                  );
                },
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.red,
                  side: const BorderSide(color: Colors.red),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                icon: const Icon(Icons.visibility_rounded, size: 18),
                label: const Text('Preview Reason'),
              ),
            )
          ]
        ],
      ),
    )).animate(delay: Duration(milliseconds: 50 * index)).fadeIn(duration: 300.ms).slideY(begin: 0.1, end: 0);
  }

  Widget _buildStatsGrid(int pending, int approved) {
    final stats = [
      {
        'label': 'Inbox',
        'value': '$pending',
        'icon': Icons.mail_outline_rounded,
        'color': AppTheme.primaryColor,
        'bg': const Color(0xFFE8F5E9),
      },
      {
        'label': 'Active/Approved',
        'value': '$approved',
        'icon': Icons.pending_actions_rounded,
        'color': AppTheme.secondaryColor,
        'bg': const Color(0xFFEFEBE9),
      },
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 14,
        mainAxisSpacing: 14,
        childAspectRatio: 1.6,
      ),
      itemCount: stats.length,
      itemBuilder: (context, index) {
        final s = stats[index];
        return _StatCard(
          label: s['label'] as String,
          value: s['value'] as String,
          icon: s['icon'] as IconData,
          accentColor: s['color'] as Color,
          bgColor: s['bg'] as Color,
        )
            .animate(delay: Duration(milliseconds: index * 80))
            .fadeIn(duration: 400.ms)
            .slideY(begin: 0.3, end: 0);
      },
    );
  }

  Widget _buildShimmerStats() {
    return Shimmer.fromColors(
      baseColor: AppTheme.backgroundColor.withValues(alpha: 0.5),
      highlightColor: AppTheme.backgroundColor,
      child: GridView.count(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisCount: 2,
        crossAxisSpacing: 14,
        mainAxisSpacing: 14,
        childAspectRatio: 1.6,
        children: List.generate(
          2,
          (_) => Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildShimmerList() {
    return Shimmer.fromColors(
      baseColor: AppTheme.backgroundColor.withValues(alpha: 0.5),
      highlightColor: AppTheme.backgroundColor,
      child: Column(
        children: List.generate(
          3,
          (_) => Container(
            margin: const EdgeInsets.fromLTRB(20, 0, 20, 12),
            height: 80,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
            ),
          ),
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color accentColor;
  final Color bgColor;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.accentColor,
    required this.bgColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.backgroundColor, width: 1),
        boxShadow: [
          BoxShadow(
            color: accentColor.withValues(alpha: 0.08),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: accentColor, size: 18),
          ),
          const SizedBox(height: 10),
          Text(
            value,
            style: TextStyle(
              color: accentColor,
              fontSize: 24,
              fontWeight: FontWeight.w900,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              color: AppTheme.secondaryColor.withValues(alpha: 0.5),
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
