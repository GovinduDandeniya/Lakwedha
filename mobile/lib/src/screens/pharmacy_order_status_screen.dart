import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:shimmer/shimmer.dart';
import 'package:ravana_app/data/datasources/remote/api_service.dart';
import 'pharmacy_finder_screen.dart';

const _primary    = Color(0xFF0D5C3E);
const _blue       = Color(0xFF1565C0);
const _background = Color(0xFFF8F9FA);

// ─── Status config ───────────────────────────────────────────────────────────
const _statusConfig = {
  'pending':    {'label': 'Pending Review', 'icon': Icons.hourglass_empty_rounded,  'color': Color(0xFFE65100)},
  'rejected':   {'label': 'Rejected',       'icon': Icons.cancel_rounded,            'color': Color(0xFFC62828)},
  'price_sent': {'label': 'Price Ready',    'icon': Icons.monetization_on_rounded,   'color': _blue},
  'paid':       {'label': 'Paid',           'icon': Icons.payment_rounded,           'color': Color(0xFF2E7D32)},
  'processing': {'label': 'Processing',     'icon': Icons.inventory_rounded,         'color': Color(0xFF6A1B9A)},
  'completed':  {'label': 'Completed',      'icon': Icons.local_shipping_rounded,    'color': Color(0xFF00695C)},
  'cancelled':  {'label': 'Cancelled',      'icon': Icons.block_rounded,             'color': Color(0xFF757575)},
};

// Steps shown in the progress stepper (excluding rejected/cancelled)
const _steps      = ['pending', 'price_sent', 'paid', 'processing', 'completed'];
const _stepLabels = ['Submitted', 'Price Set', 'Paid', 'Processing', 'Done'];

class PharmacyOrderStatusScreen extends StatefulWidget {
  const PharmacyOrderStatusScreen({super.key});

  @override
  State<PharmacyOrderStatusScreen> createState() =>
      _PharmacyOrderStatusScreenState();
}

class _PharmacyOrderStatusScreenState extends State<PharmacyOrderStatusScreen> {
  final _api = ApiService();

  List<Map<String, dynamic>> _requests = [];
  bool   _isLoading    = true;
  bool   _isRefreshing = false;
  String? _error;
  Timer? _autoRefreshTimer;

  @override
  void initState() {
    super.initState();
    _fetchRequests(initial: true);
    _autoRefreshTimer = Timer.periodic(
      const Duration(seconds: 15),
      (_) => _fetchRequests(silent: true),
    );
  }

  @override
  void dispose() {
    _autoRefreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchRequests({
    bool initial = false,
    bool silent  = false,
  }) async {
    if (!mounted) return;
    if (initial) setState(() { _isLoading = true; _error = null; });
    if (!silent && !initial) setState(() { _isRefreshing = true; _error = null; });

    try {
      final data = await _api.getMyPharmacyRequests();
      if (!mounted) return;
      setState(() { _requests = data; });
    } catch (e) {
      if (!mounted) return;
      if (!silent) setState(() { _error = e.toString().replaceFirst('Exception: ', ''); });
    } finally {
      if (mounted) setState(() { _isLoading = false; _isRefreshing = false; });
    }
  }

  Future<void> _payNow(Map<String, dynamic> request) async {
    HapticFeedback.mediumImpact();

    final pharmacy     = request['pharmacy'] as Map<String, dynamic>?;
    final pharmacyName = pharmacy?['pharmacyName'] as String? ?? 'Pharmacy';
    final price        = request['price'];

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Confirm Payment',
            style: TextStyle(fontWeight: FontWeight.w800)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: _primary.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(children: [
                const Icon(Icons.local_pharmacy_rounded, color: _primary, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(pharmacyName,
                      style: const TextStyle(
                          fontWeight: FontWeight.w700, color: _primary)),
                ),
              ]),
            ),
            const SizedBox(height: 16),
            const Text('Total Amount',
                style: TextStyle(color: Colors.grey, fontSize: 12)),
            const SizedBox(height: 4),
            Text('LKR $price',
                style: const TextStyle(
                    fontSize: 28, fontWeight: FontWeight.w900, color: _blue)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: _primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Confirm & Pay',
                style: TextStyle(fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );
    if (confirm != true || !mounted) return;

    try {
      await _api.payForPharmacyRequest(request['_id'] as String);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: const Row(children: [
          Icon(Icons.check_circle_rounded, color: Colors.white, size: 18),
          SizedBox(width: 8),
          Expanded(child: Text('Payment confirmed! Pharmacy will process your order.')),
        ]),
        backgroundColor: _primary,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ));
      _fetchRequests();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(e.toString().replaceFirst('Exception: ', '')),
        backgroundColor: Colors.red.shade700,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ));
    }
  }

  Future<void> _cancelOrder(Map<String, dynamic> request) async {
    HapticFeedback.mediumImpact();

    final pharmacy     = request['pharmacy'] as Map<String, dynamic>?;
    final pharmacyName = pharmacy?['pharmacyName'] as String? ?? 'Pharmacy';

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Cancel Order?',
            style: TextStyle(fontWeight: FontWeight.w800)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.orange.withValues(alpha: 0.07),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(children: [
                const Icon(Icons.local_pharmacy_rounded, color: _primary, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(pharmacyName,
                      style: const TextStyle(
                          fontWeight: FontWeight.w700, color: _primary)),
                ),
              ]),
            ),
            const SizedBox(height: 14),
            const Text(
              'Are you sure you want to cancel this prescription order? This action cannot be undone.',
              style: TextStyle(color: Colors.black87, fontSize: 13, height: 1.5),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Keep Order', style: TextStyle(color: _primary, fontWeight: FontWeight.w700)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade700,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Yes, Cancel', style: TextStyle(fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );
    if (confirm != true || !mounted) return;

    try {
      await _api.cancelPharmacyRequest(request['_id'] as String);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: const Row(children: [
          Icon(Icons.check_circle_rounded, color: Colors.white, size: 18),
          SizedBox(width: 8),
          Expanded(child: Text('Order cancelled successfully.')),
        ]),
        backgroundColor: Colors.grey.shade700,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ));
      _fetchRequests();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(e.toString().replaceFirst('Exception: ', '')),
        backgroundColor: Colors.red.shade700,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ));
    }
  }

  // ── Build ──────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _background,
      appBar: AppBar(
        backgroundColor: _primary,
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text('My Orders',
            style: TextStyle(fontWeight: FontWeight.w900)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          if (_isRefreshing)
            const Padding(
              padding: EdgeInsets.only(right: 14),
              child: Center(
                child: SizedBox(
                  width: 18, height: 18,
                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                ),
              ),
            )
          else
            IconButton(
              icon: const Icon(Icons.refresh_rounded),
              onPressed: _fetchRequests,
              tooltip: 'Refresh',
            ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading)        return _buildShimmer();
    if (_error != null)    return _buildError();
    if (_requests.isEmpty) return _buildEmpty();

    return RefreshIndicator(
      onRefresh: _fetchRequests,
      color: _primary,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 40),
        physics: const AlwaysScrollableScrollPhysics(),
        itemCount: _requests.length,
        itemBuilder: (ctx, i) => _OrderCard(
          request: _requests[i],
          index: i,
          onPayNow: () => _payNow(_requests[i]),
          onCancel: () => _cancelOrder(_requests[i]),
        ),
      ),
    );
  }

  Widget _buildEmpty() => Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              color: _primary.withValues(alpha: 0.07),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.shopping_bag_outlined, color: _primary, size: 56),
          ),
          const SizedBox(height: 20),
          const Text('No Orders Yet',
              style: TextStyle(color: _primary, fontSize: 20, fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          Text(
            'You haven\'t placed any pharmacy orders yet.\nUpload a prescription at a nearby pharmacy to get started.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey.shade500, fontSize: 13, height: 1.5),
          ),
          const SizedBox(height: 28),
          ElevatedButton.icon(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const PharmacyFinderScreen()),
            ),
            icon: const Icon(Icons.local_pharmacy_rounded, size: 18),
            label: const Text('Find a Pharmacy',
                style: TextStyle(fontWeight: FontWeight.w800)),
            style: ElevatedButton.styleFrom(
              backgroundColor: _primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
          ),
          const SizedBox(height: 12),
          TextButton.icon(
            onPressed: _fetchRequests,
            icon: const Icon(Icons.refresh_rounded, size: 16),
            label: const Text('Refresh'),
            style: TextButton.styleFrom(foregroundColor: _primary),
          ),
        ],
      ).animate().fadeIn(duration: 500.ms),
    ),
  );

  Widget _buildError() => Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline_rounded, color: Colors.red.shade400, size: 52),
          const SizedBox(height: 16),
          const Text('Failed to load orders',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.red.shade50,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.red.shade200),
            ),
            child: Text(
              _error!,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.red.shade700, fontSize: 12),
            ),
          ),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: _fetchRequests,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Retry', style: TextStyle(fontWeight: FontWeight.w700)),
            style: ElevatedButton.styleFrom(
                backgroundColor: _primary, foregroundColor: Colors.white),
          ),
        ],
      ),
    ),
  );

  Widget _buildShimmer() => Shimmer.fromColors(
    baseColor: Colors.grey.shade200,
    highlightColor: Colors.grey.shade100,
    child: ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 40),
      itemCount: 4,
      itemBuilder: (_, __) => Container(
        margin: const EdgeInsets.only(bottom: 16),
        height: 200,
        decoration: BoxDecoration(
            color: Colors.white, borderRadius: BorderRadius.circular(20)),
      ),
    ),
  );
}

// ─── Order Card ──────────────────────────────────────────────────────────────
class _OrderCard extends StatefulWidget {
  final Map<String, dynamic> request;
  final int index;
  final VoidCallback onPayNow;
  final VoidCallback onCancel;

  const _OrderCard({
    required this.request,
    required this.index,
    required this.onPayNow,
    required this.onCancel,
  });

  @override
  State<_OrderCard> createState() => _OrderCardState();
}

class _OrderCardState extends State<_OrderCard> {
  bool _showDetails = false;

  @override
  Widget build(BuildContext context) {
    final request      = widget.request;
    final status       = request['status'] as String? ?? 'pending';
    final cfg          = (_statusConfig[status] ?? _statusConfig['pending'])!;
    final pharmacy     = request['pharmacy'] as Map<String, dynamic>?;
    final pharmacyName = pharmacy?['pharmacyName'] as String? ?? 'Pharmacy';
    final pharmacyCity = pharmacy?['city']         as String? ?? '';
    final pharmacyPhone= pharmacy?['phone']        as String? ?? '';
    final price        = request['price'];
    final rejection    = request['rejectionReason'] as String?;
    final createdAt    = request['createdAt']        as String?;
    final prescriptionUrl = request['prescriptionFileUrl'] as String?;
    final patientDetails  = request['patientDetails'] as Map<String, dynamic>?;
    final isRejected   = status == 'rejected';
    final isCancelled  = status == 'cancelled';
    final isPending    = status == 'pending';

    final statusColor = cfg['color'] as Color;
    final statusIcon  = cfg['icon']  as IconData;
    final statusLabel = cfg['label'] as String;

    String dateStr = '';
    if (createdAt != null) {
      try {
        final dt = DateTime.parse(createdAt).toLocal();
        dateStr = '${dt.day}/${dt.month}/${dt.year}';
      } catch (_) {}
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: status == 'price_sent'
            ? Border.all(color: _blue.withValues(alpha: 0.4), width: 1.5)
            : isCancelled
                ? Border.all(color: Colors.grey.shade300)
                : null,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [

            // ── Header ────────────────────────────────────────────────────────
            Row(children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.10),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(statusIcon, color: statusColor, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(pharmacyName,
                        style: const TextStyle(
                            color: _primary, fontSize: 15, fontWeight: FontWeight.w800)),
                    if (pharmacyCity.isNotEmpty)
                      Text(pharmacyCity,
                          style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.10),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(statusLabel,
                        style: TextStyle(
                            color: statusColor, fontSize: 11, fontWeight: FontWeight.w700)),
                  ),
                  if (dateStr.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(dateStr,
                        style: TextStyle(color: Colors.grey.shade400, fontSize: 10)),
                  ],
                ],
              ),
            ]),

            // ── Progress stepper ──────────────────────────────────────────────
            if (!isRejected && !isCancelled) ...[
              const SizedBox(height: 14),
              _StatusStepper(currentStatus: status),
            ],

            // ── Rejection reason ───────────────────────────────────────────────
            if (isRejected && rejection != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.info_outline_rounded, color: Colors.red.shade400, size: 14),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(rejection,
                          style: TextStyle(
                              color: Colors.red.shade700, fontSize: 12, height: 1.4)),
                    ),
                  ],
                ),
              ),
            ],

            // ── Cancelled notice ───────────────────────────────────────────────
            if (isCancelled) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(children: [
                  Icon(Icons.block_rounded, color: Colors.grey.shade600, size: 15),
                  const SizedBox(width: 8),
                  Text('Order cancelled by you',
                      style: TextStyle(
                          color: Colors.grey.shade600, fontSize: 13, fontWeight: FontWeight.w600)),
                ]),
              ),
            ],

            // ── Price + Pay Now ────────────────────────────────────────────────
            if (status == 'price_sent' && price != null) ...[
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: _blue.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: _blue.withValues(alpha: 0.2)),
                ),
                child: Row(children: [
                  const Icon(Icons.monetization_on_rounded, color: _blue, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Total Amount',
                            style: TextStyle(color: _blue, fontSize: 11, fontWeight: FontWeight.w600)),
                        Text('LKR $price',
                            style: const TextStyle(
                                color: _blue, fontSize: 20, fontWeight: FontWeight.w900)),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    onPressed: widget.onPayNow,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _blue,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 11),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text('Pay Now',
                        style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                  ),
                ]),
              ),
            ],

            // ── Paid confirmation ──────────────────────────────────────────────
            if (status == 'paid') ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                decoration: BoxDecoration(
                  color: const Color(0xFF2E7D32).withValues(alpha: 0.07),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(children: [
                  const Icon(Icons.check_circle_rounded, color: Color(0xFF2E7D32), size: 16),
                  const SizedBox(width: 8),
                  Text('LKR $price — Payment received',
                      style: const TextStyle(
                          color: Color(0xFF2E7D32), fontSize: 13, fontWeight: FontWeight.w700)),
                ]),
              ),
            ],

            // ── Processing / Completed ─────────────────────────────────────────
            if (status == 'processing' || status == 'completed') ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.07),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(children: [
                  Icon(
                    status == 'completed'
                        ? Icons.local_shipping_rounded
                        : Icons.inventory_rounded,
                    color: statusColor,
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    status == 'completed'
                        ? 'Order completed — Thank you!'
                        : 'Pharmacy is preparing your order…',
                    style: TextStyle(
                        color: statusColor, fontSize: 13, fontWeight: FontWeight.w700),
                  ),
                ]),
              ),
            ],

            // ── Expand/collapse details toggle ────────────────────────────────
            const SizedBox(height: 10),
            GestureDetector(
              onTap: () => setState(() => _showDetails = !_showDetails),
              child: Row(children: [
                Text(
                  _showDetails ? 'Hide Details' : 'View Details',
                  style: TextStyle(
                      color: _primary.withValues(alpha: 0.75),
                      fontSize: 12,
                      fontWeight: FontWeight.w700),
                ),
                const SizedBox(width: 4),
                Icon(
                  _showDetails ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded,
                  color: _primary.withValues(alpha: 0.75),
                  size: 18,
                ),
              ]),
            ),

            // ── Expanded details ──────────────────────────────────────────────
            if (_showDetails) ...[
              const SizedBox(height: 12),
              const Divider(height: 1),
              const SizedBox(height: 12),

              // Patient details
              if (patientDetails != null) ...[
                _detailRow(Icons.person_outline_rounded, 'Patient',
                    '${patientDetails['firstName'] ?? ''} ${patientDetails['lastName'] ?? ''}'.trim()),
                const SizedBox(height: 6),
                _detailRow(Icons.home_outlined, 'Address',
                    patientDetails['address']?.toString() ?? '—'),
                const SizedBox(height: 6),
                _detailRow(Icons.phone_outlined, 'Mobile',
                    patientDetails['mobile']?.toString() ?? '—'),
                const SizedBox(height: 10),
              ],

              // Pharmacy phone
              if (pharmacyPhone.isNotEmpty) ...[
                _detailRow(Icons.local_pharmacy_rounded, 'Pharmacy Phone', pharmacyPhone),
                const SizedBox(height: 10),
              ],

              // Prescription file
              if (prescriptionUrl != null && prescriptionUrl.isNotEmpty) ...[
                Row(children: [
                  Icon(Icons.description_rounded, color: _primary, size: 15),
                  const SizedBox(width: 8),
                  const Text('Prescription',
                      style: TextStyle(
                          color: _primary, fontSize: 12, fontWeight: FontWeight.w700)),
                ]),
                const SizedBox(height: 8),
                Container(
                  height: 180,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade300),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: _PrescriptionPreview(url: prescriptionUrl),
                  ),
                ),
              ],

              // Cancel button (only for pending)
              if (isPending) ...[
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: widget.onCancel,
                    icon: const Icon(Icons.cancel_outlined, size: 16),
                    label: const Text('Cancel Order',
                        style: TextStyle(fontWeight: FontWeight.w700)),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.red.shade700,
                      side: BorderSide(color: Colors.red.shade300),
                      padding: const EdgeInsets.symmetric(vertical: 11),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ],
            ],
          ],
        ),
      ),
    )
        .animate(delay: Duration(milliseconds: 60 * widget.index))
        .fadeIn(duration: 350.ms)
        .slideY(begin: 0.06, end: 0);
  }

  Widget _detailRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: Colors.grey.shade500, size: 14),
        const SizedBox(width: 8),
        Text('$label: ',
            style: TextStyle(
                color: Colors.grey.shade500, fontSize: 12, fontWeight: FontWeight.w600)),
        Expanded(
          child: Text(value,
              style: const TextStyle(
                  color: Colors.black87, fontSize: 12, fontWeight: FontWeight.w500)),
        ),
      ],
    );
  }
}

// ─── Prescription preview (image or PDF placeholder) ─────────────────────────
class _PrescriptionPreview extends StatelessWidget {
  final String url;
  const _PrescriptionPreview({required this.url});

  bool get _isPdf => url.toLowerCase().endsWith('.pdf');

  @override
  Widget build(BuildContext context) {
    if (_isPdf) {
      return Container(
        color: Colors.grey.shade100,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.picture_as_pdf_rounded, color: Colors.red.shade400, size: 48),
            const SizedBox(height: 8),
            Text('PDF Prescription',
                style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
          ],
        ),
      );
    }

    // Determine base URL for image
    final baseUrl = url.startsWith('http') ? url : 'http://10.0.2.2:5000$url';

    return Image.network(
      baseUrl,
      fit: BoxFit.cover,
      loadingBuilder: (_, child, progress) {
        if (progress == null) return child;
        return Center(
          child: CircularProgressIndicator(
            value: progress.expectedTotalBytes != null
                ? progress.cumulativeBytesLoaded / progress.expectedTotalBytes!
                : null,
            color: _primary,
            strokeWidth: 2,
          ),
        );
      },
      errorBuilder: (_, __, ___) => Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.image_not_supported_rounded, color: Colors.grey.shade400, size: 40),
          const SizedBox(height: 8),
          Text('Could not load image',
              style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
        ],
      ),
    );
  }
}

// ─── Status Progress Stepper ─────────────────────────────────────────────────
class _StatusStepper extends StatelessWidget {
  final String currentStatus;
  const _StatusStepper({required this.currentStatus});

  @override
  Widget build(BuildContext context) {
    final currentIndex = _steps.indexOf(currentStatus);

    return Row(
      children: List.generate(_steps.length * 2 - 1, (i) {
        if (i.isOdd) {
          final filled = currentIndex > (i - 1) ~/ 2;
          return Expanded(
            child: Container(
              height: 2,
              color: filled ? _primary.withValues(alpha: 0.5) : Colors.grey.shade200,
            ),
          );
        }

        final stepIndex = i ~/ 2;
        final isDone    = currentIndex > stepIndex;
        final isCurrent = currentIndex == stepIndex;
        final dotColor  = isDone || isCurrent ? _primary : Colors.grey.shade300;

        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 22, height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isDone
                    ? _primary
                    : isCurrent
                        ? _primary.withValues(alpha: 0.15)
                        : Colors.grey.shade200,
                border: Border.all(color: dotColor, width: isCurrent ? 2 : 1.5),
              ),
              child: isDone
                  ? const Icon(Icons.check_rounded, color: Colors.white, size: 12)
                  : isCurrent
                      ? Center(
                          child: Container(
                            width: 8, height: 8,
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              color: _primary,
                            ),
                          ),
                        )
                      : null,
            ),
            const SizedBox(height: 4),
            Text(
              _stepLabels[stepIndex],
              style: TextStyle(
                fontSize: 8.5,
                fontWeight: isCurrent ? FontWeight.w800 : FontWeight.w500,
                color: isCurrent ? _primary : Colors.grey.shade400,
              ),
            ),
          ],
        );
      }),
    );
  }
}
