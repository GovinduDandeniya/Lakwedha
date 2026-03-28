import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:shimmer/shimmer.dart';
import 'package:ravana_app/data/datasources/remote/api_service.dart';
import 'pharmacy_finder_screen.dart';
import 'pharmacy_payment_gateway_screen.dart';

// ─── Color palette ────────────────────────────────────────────────────────────
const _primary    = Color(0xFF0D5C3E);
const _blue       = Color(0xFF1565C0);
const _background = Color(0xFFF8F9FA);

// ─── Status configuration ─────────────────────────────────────────────────────
const _statusCfg = <String, Map<String, Object>>{
  'pending':    {'label': 'Pending Review',  'icon': Icons.hourglass_empty_rounded,  'color': Color(0xFFE65100)},
  'rejected':   {'label': 'Rejected',        'icon': Icons.cancel_rounded,            'color': Color(0xFFC62828)},
  'price_sent': {'label': 'Price Ready',     'icon': Icons.monetization_on_rounded,   'color': _blue},
  'paid':       {'label': 'Paid',            'icon': Icons.payment_rounded,           'color': Color(0xFF2E7D32)},
  'processing': {'label': 'Processing',      'icon': Icons.inventory_rounded,         'color': Color(0xFF6A1B9A)},
  'completed':  {'label': 'Completed',       'icon': Icons.local_shipping_rounded,    'color': Color(0xFF00695C)},
  'cancelled':  {'label': 'Cancelled',       'icon': Icons.block_rounded,             'color': Color(0xFF757575)},
};

// Steps for the progress stepper
const _steps      = ['pending', 'price_sent', 'paid', 'processing', 'completed'];
const _stepLabels = ['Submitted', 'Price Set', 'Paid', 'Processing', 'Done'];

// ─── Screen ───────────────────────────────────────────────────────────────────
class PatientOrdersScreen extends StatefulWidget {
  const PatientOrdersScreen({super.key});

  @override
  State<PatientOrdersScreen> createState() => _PatientOrdersScreenState();
}

class _PatientOrdersScreenState extends State<PatientOrdersScreen> {
  final _api = ApiService();

  List<Map<String, dynamic>> _orders = [];
  bool    _isLoading    = true;
  bool    _isRefreshing = false;
  bool    _isPaying     = false;
  String? _error;
  Timer?  _timer;

  @override
  void initState() {
    super.initState();
    _load(initial: true);
    // Auto-refresh every 15 s so status updates show without manual pull
    _timer = Timer.periodic(
      const Duration(seconds: 15),
      (_) => _load(silent: true),
    );
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  // ── Fetch ──────────────────────────────────────────────────────────────────
  Future<void> _load({
    bool initial = false,
    bool silent  = false,
  }) async {
    if (!mounted) return;
    if (initial) setState(() { _isLoading = true; _error = null; });
    if (!silent && !initial) setState(() { _isRefreshing = true; _error = null; });

    try {
      final data = await _api.getMyPharmacyRequests();
      if (mounted) setState(() => _orders = data);
    } catch (e) {
      if (mounted && !silent) {
        setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
      }
    } finally {
      if (mounted) setState(() { _isLoading = false; _isRefreshing = false; });
    }
  }

  // ── Pay ────────────────────────────────────────────────────────────────────
  Future<void> _payNow(Map<String, dynamic> order) async {
    HapticFeedback.mediumImpact();

    if (!_isPharmacyRequestOrder(order)) {
      _showSnack('This order is read-only in this screen.', Colors.orange.shade700);
      return;
    }

    final requestId = _orderId(order);
    if (requestId == null) {
      _showSnack('Missing order id. Please refresh and try again.', Colors.red.shade700);
      return;
    }

    final pharmacy     = _pharmacyMap(order['pharmacy']);
    final pharmacyName = pharmacy?['pharmacyName'] as String? ?? 'Pharmacy';
    final price        = order['price'];

    final amount = (price is num) ? price : num.tryParse(price?.toString() ?? '0') ?? 0;
    final paid = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => PharmacyPaymentGatewayScreen(
          requestId: requestId,
          pharmacyName: pharmacyName,
          amount: amount,
        ),
      ),
    );

    if (paid == true && mounted) {
      HapticFeedback.heavyImpact();
      _load();
    }
  }

  // ── Cancel ─────────────────────────────────────────────────────────────────
  Future<void> _cancelOrder(Map<String, dynamic> order) async {
    HapticFeedback.mediumImpact();

    if (!_isPharmacyRequestOrder(order)) {
      _showSnack('This order cannot be cancelled from this screen.', Colors.orange.shade700);
      return;
    }

    final requestId = _orderId(order);
    if (requestId == null) {
      _showSnack('Missing order id. Please refresh and try again.', Colors.red.shade700);
      return;
    }

    final pharmacy     = _pharmacyMap(order['pharmacy']);
    final pharmacyName = pharmacy?['pharmacyName'] as String? ?? 'Pharmacy';

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Text('Cancel Order?',
            style: TextStyle(fontWeight: FontWeight.w900)),
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
                          color: _primary, fontWeight: FontWeight.w700)),
                ),
              ]),
            ),
            const SizedBox(height: 14),
            const Text(
              'Are you sure you want to cancel this prescription order?\n'
              'This cannot be undone.',
              style: TextStyle(color: Colors.black87, fontSize: 13, height: 1.5),
            ),
          ],
        ),
        actionsAlignment: MainAxisAlignment.spaceBetween,
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Keep Order',
                style: TextStyle(
                    color: _primary, fontWeight: FontWeight.w700)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade700,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Yes, Cancel',
                style: TextStyle(fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    try {
      await _api.cancelPharmacyRequest(requestId);
      if (!mounted) return;
      _showSnack('Order cancelled.', Colors.grey.shade700);
      _load();
    } catch (e) {
      if (mounted) {
        _showSnack(e.toString().replaceFirst('Exception: ', ''), Colors.red.shade700);
      }
    }
  }

  void _showSnack(String msg, Color color) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: color,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ));
  }

  Map<String, dynamic>? _pharmacyMap(dynamic raw) {
    if (raw is Map) return Map<String, dynamic>.from(raw);
    return null;
  }

  bool _isPharmacyRequestOrder(Map<String, dynamic> order) {
    return (order['orderSystem']?.toString() ?? 'pharmacy_request') ==
        'pharmacy_request';
  }

  String? _orderId(Map<String, dynamic> order) {
    final dynamic id = order['_id'] ?? order['id'];
    if (id == null) return null;
    final value = id.toString();
    return value.isEmpty ? null : value;
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
              padding: EdgeInsets.only(right: 16),
              child: Center(
                child: SizedBox(
                  width: 18, height: 18,
                  child: CircularProgressIndicator(
                      color: Colors.white, strokeWidth: 2),
                ),
              ),
            )
          else
            IconButton(
              icon: const Icon(Icons.refresh_rounded),
              tooltip: 'Refresh',
              onPressed: _load,
            ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) return _buildShimmer();
    if (_error != null) return _buildError();
    if (_orders.isEmpty) return _buildEmpty();

    return RefreshIndicator(
      onRefresh: _load,
      color: _primary,
      child: ListView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 40),
        itemCount: _orders.length,
        itemBuilder: (ctx, i) => _OrderCard(
          order: _orders[i],
          index: i,
          isPaying: _isPaying,
          onPayNow:  () => _payNow(_orders[i]),
          onCancel:  () => _cancelOrder(_orders[i]),
        ),
      ),
    );
  }

  // ── Empty ──────────────────────────────────────────────────────────────────
  Widget _buildEmpty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: _primary.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.shopping_bag_outlined,
                  color: _primary, size: 60),
            ),
            const SizedBox(height: 24),
            const Text('No Orders Found',
                style: TextStyle(
                    color: _primary,
                    fontSize: 22,
                    fontWeight: FontWeight.w900)),
            const SizedBox(height: 10),
            Text(
              "You haven't placed any pharmacy orders yet.\n"
              "Upload a prescription to a nearby pharmacy to get started.",
              textAlign: TextAlign.center,
              style: TextStyle(
                  color: Colors.grey.shade500, fontSize: 13, height: 1.6),
            ),
            const SizedBox(height: 32),
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
                padding: const EdgeInsets.symmetric(
                    horizontal: 28, vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
              ),
            ),
            const SizedBox(height: 12),
            TextButton.icon(
              onPressed: _load,
              icon: const Icon(Icons.refresh_rounded, size: 16),
              label: const Text('Refresh'),
              style: TextButton.styleFrom(foregroundColor: _primary),
            ),
          ],
        ).animate().fadeIn(duration: 400.ms),
      ),
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline_rounded,
                color: Colors.red.shade400, size: 56),
            const SizedBox(height: 16),
            const Text('Failed to load orders',
                style: TextStyle(
                    fontSize: 17, fontWeight: FontWeight.w800)),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.red.shade200),
              ),
              child: Text(
                _error!,
                textAlign: TextAlign.center,
                style: TextStyle(
                    color: Colors.red.shade700, fontSize: 12, height: 1.4),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => _load(initial: true),
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Retry',
                  style: TextStyle(fontWeight: FontWeight.w700)),
              style: ElevatedButton.styleFrom(
                  backgroundColor: _primary, foregroundColor: Colors.white),
            ),
          ],
        ),
      ),
    );
  }

  // ── Shimmer skeleton ───────────────────────────────────────────────────────
  Widget _buildShimmer() {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade300,
      highlightColor: Colors.grey.shade100,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 40),
        itemCount: 4,
        itemBuilder: (_, __) => Container(
          margin: const EdgeInsets.only(bottom: 16),
          height: 200,
          decoration: BoxDecoration(
            color: Colors.grey.shade300,
            borderRadius: BorderRadius.circular(20),
          ),
        ),
      ),
    );
  }
}

// ─── Order Card ───────────────────────────────────────────────────────────────
class _OrderCard extends StatefulWidget {
  final Map<String, dynamic> order;
  final int index;
  final bool isPaying;
  final VoidCallback onPayNow;
  final VoidCallback onCancel;

  const _OrderCard({
    required this.order,
    required this.index,
    required this.isPaying,
    required this.onPayNow,
    required this.onCancel,
  });

  @override
  State<_OrderCard> createState() => _OrderCardState();
}

class _OrderCardState extends State<_OrderCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final order       = widget.order;
    final status      = order['status'] as String? ?? 'pending';
    final cfg         = _statusCfg[status] ?? _statusCfg['pending']!;
    final statusColor = cfg['color'] as Color;
    final statusIcon  = cfg['icon']  as IconData;
    final statusLabel = cfg['label'] as String;

    final pharmacy     = _pharmacyMap(order['pharmacy']);
    final pharmacyName = pharmacy?['pharmacyName'] as String? ?? 'Pharmacy';
    final pharmacyCity = pharmacy?['city']          as String? ?? '';
    final pharmacyPhone= pharmacy?['phone']         as String? ?? '';

    final price           = order['price'];
    final rejectionReason = order['rejectionReason'] as String?;
    final createdAt       = order['createdAt']        as String?;
    final prescriptionUrl = order['prescriptionFileUrl'] as String?;
    final patientDetails  = order['patientDetails'] as Map<String, dynamic>?;

    final isPharmacyRequest =
      (order['orderSystem']?.toString() ?? 'pharmacy_request') ==
        'pharmacy_request';
    final isRejected  = status == 'rejected';
    final isCancelled = status == 'cancelled';
    final isPending   = status == 'pending' && isPharmacyRequest;
    final isPriceSent = status == 'price_sent' && isPharmacyRequest;

    final dateStr = _fmt(createdAt);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: isPriceSent
            ? Border.all(color: _blue.withValues(alpha: 0.5), width: 1.5)
            : isCancelled || isRejected
                ? Border.all(color: Colors.grey.shade200)
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

            // ── Header ─────────────────────────────────────────────────────
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
                            color: _primary,
                            fontSize: 15,
                            fontWeight: FontWeight.w800)),
                    if (pharmacyCity.isNotEmpty)
                      Text(pharmacyCity,
                          style: TextStyle(
                              color: Colors.grey.shade500, fontSize: 12)),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.10),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(statusLabel,
                        style: TextStyle(
                            color: statusColor,
                            fontSize: 11,
                            fontWeight: FontWeight.w700)),
                  ),
                  if (dateStr.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(dateStr,
                        style: TextStyle(
                            color: Colors.grey.shade400, fontSize: 10)),
                  ],
                ],
              ),
            ]),

            // ── Progress stepper ───────────────────────────────────────────
            if (!isRejected && !isCancelled) ...[
              const SizedBox(height: 14),
              _Stepper(current: status),
            ],

            // ── Rejection reason ───────────────────────────────────────────
            if (isRejected && rejectionReason != null) ...[
              const SizedBox(height: 12),
              _infoBox(
                icon: Icons.info_outline_rounded,
                text: rejectionReason,
                color: Colors.red.shade700,
                bg: Colors.red.shade50,
              ),
            ],

            // ── Cancelled notice ───────────────────────────────────────────
            if (isCancelled) ...[
              const SizedBox(height: 12),
              _infoBox(
                icon: Icons.block_rounded,
                text: 'Order cancelled by you',
                color: Colors.grey.shade700,
                bg: Colors.grey.shade100,
              ),
            ],

            // ── Price banner + Pay Now ─────────────────────────────────────
            if (isPriceSent && price != null) ...[
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: _blue.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: _blue.withValues(alpha: 0.2)),
                ),
                child: Row(children: [
                  const Icon(Icons.monetization_on_rounded,
                      color: _blue, size: 22),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Total Amount',
                            style: TextStyle(
                                color: _blue,
                                fontSize: 11,
                                fontWeight: FontWeight.w600)),
                        Text('LKR $price',
                            style: const TextStyle(
                                color: _blue,
                                fontSize: 22,
                                fontWeight: FontWeight.w900)),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    onPressed: widget.isPaying ? null : widget.onPayNow,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _blue,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 20, vertical: 12),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: widget.isPaying
                        ? const SizedBox(
                            width: 16, height: 16,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2),
                          )
                        : const Text('Pay Now',
                            style: TextStyle(
                                fontWeight: FontWeight.w900, fontSize: 13)),
                  ),
                ]),
              ),
            ],

            // ── Paid confirmation ──────────────────────────────────────────
            if (status == 'paid' && price != null) ...[
              const SizedBox(height: 12),
              _infoBox(
                icon: Icons.check_circle_rounded,
                text: 'LKR $price — Payment received',
                color: const Color(0xFF2E7D32),
                bg: const Color(0xFF2E7D32),
                bgAlpha: 0.07,
              ),
            ],

            // ── Processing / Completed ────────────────────────────────────
            if (status == 'processing' || status == 'completed') ...[
              const SizedBox(height: 12),
              _infoBox(
                icon: status == 'completed'
                    ? Icons.local_shipping_rounded
                    : Icons.inventory_rounded,
                text: status == 'completed'
                    ? 'Order completed — Thank you!'
                    : 'Pharmacy is preparing your order…',
                color: statusColor,
                bg: statusColor,
                bgAlpha: 0.07,
              ),
            ],

            // ── Expand toggle ──────────────────────────────────────────────
            const SizedBox(height: 12),
            GestureDetector(
              onTap: () => setState(() => _expanded = !_expanded),
              child: Row(children: [
                Text(
                  _expanded ? 'Hide Details' : 'View Details',
                  style: TextStyle(
                      color: _primary.withValues(alpha: 0.75),
                      fontSize: 12,
                      fontWeight: FontWeight.w700),
                ),
                const SizedBox(width: 4),
                Icon(
                  _expanded
                      ? Icons.keyboard_arrow_up_rounded
                      : Icons.keyboard_arrow_down_rounded,
                  color: _primary.withValues(alpha: 0.75),
                  size: 18,
                ),
              ]),
            ),

            // ── Expanded details ───────────────────────────────────────────
            if (_expanded) ...[
              const SizedBox(height: 12),
              const Divider(height: 1),
              const SizedBox(height: 14),

              if (patientDetails != null) ...[
                _row(Icons.person_outline_rounded, 'Patient',
                    '${patientDetails['firstName'] ?? ''} ${patientDetails['lastName'] ?? ''}'.trim()),
                const SizedBox(height: 6),
                _row(Icons.home_outlined, 'Address',
                    patientDetails['address']?.toString() ?? '—'),
                const SizedBox(height: 6),
                _row(Icons.phone_outlined, 'Mobile',
                    patientDetails['mobile']?.toString() ?? '—'),
                const SizedBox(height: 10),
              ],

              if (pharmacyPhone.isNotEmpty) ...[
                _row(Icons.local_pharmacy_rounded, 'Pharmacy Phone',
                    pharmacyPhone),
                const SizedBox(height: 10),
              ],

              // Prescription preview
              if (prescriptionUrl != null && prescriptionUrl.isNotEmpty) ...[
                const Row(children: [
                  Icon(Icons.description_rounded,
                      color: _primary, size: 15),
                  SizedBox(width: 8),
                  Text('Prescription',
                      style: TextStyle(
                          color: _primary,
                          fontSize: 12,
                          fontWeight: FontWeight.w700)),
                ]),
                const SizedBox(height: 8),
                Container(
                  height: 190,
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

              // Cancel (only when pending)
              if (isPending) ...[
                const SizedBox(height: 16),
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
                      padding: const EdgeInsets.symmetric(vertical: 12),
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

  Map<String, dynamic>? _pharmacyMap(dynamic raw) {
    if (raw is Map) return Map<String, dynamic>.from(raw);
    return null;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  Widget _infoBox({
    required IconData icon,
    required String text,
    required Color color,
    required Color bg,
    double bgAlpha = 1.0,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: bgAlpha < 1.0
            ? bg.withValues(alpha: bgAlpha)
            : bg.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 15),
          const SizedBox(width: 8),
          Expanded(
            child: Text(text,
                style: TextStyle(
                    color: color, fontSize: 13, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  Widget _row(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: Colors.grey.shade500, size: 14),
        const SizedBox(width: 8),
        Text('$label: ',
            style: TextStyle(
                color: Colors.grey.shade500,
                fontSize: 12,
                fontWeight: FontWeight.w600)),
        Expanded(
          child: Text(value,
              style: const TextStyle(
                  color: Colors.black87,
                  fontSize: 12,
                  fontWeight: FontWeight.w500)),
        ),
      ],
    );
  }

  String _fmt(String? iso) {
    if (iso == null) return '';
    try {
      final d = DateTime.parse(iso).toLocal();
      return '${d.day}/${d.month}/${d.year}';
    } catch (_) {
      return '';
    }
  }
}

// ─── Prescription preview ─────────────────────────────────────────────────────
class _PrescriptionPreview extends StatelessWidget {
  final String url;
  const _PrescriptionPreview({required this.url});

  bool get _isPdf => url.toLowerCase().endsWith('.pdf');

  @override
  Widget build(BuildContext context) {
    if (_isPdf) {
      return Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.picture_as_pdf_rounded,
              color: Colors.red.shade400, size: 48),
          const SizedBox(height: 8),
          Text('PDF Prescription',
              style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
        ],
      );
    }

    final resolved = url.startsWith('http')
        ? url
        : '${const String.fromEnvironment('API_URL', defaultValue: 'http://10.0.2.2:5000')}$url';

    return Image.network(
      resolved,
      fit: BoxFit.cover,
      loadingBuilder: (_, child, prog) {
        if (prog == null) return child;
        return Center(
          child: CircularProgressIndicator(
            value: prog.expectedTotalBytes != null
                ? prog.cumulativeBytesLoaded / prog.expectedTotalBytes!
                : null,
            color: _primary,
            strokeWidth: 2,
          ),
        );
      },
      errorBuilder: (_, __, ___) => Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.image_not_supported_rounded,
              color: Colors.grey.shade400, size: 40),
          const SizedBox(height: 8),
          Text('Could not load image',
              style: TextStyle(
                  color: Colors.grey.shade500, fontSize: 12)),
        ],
      ),
    );
  }
}

// ─── Progress Stepper ─────────────────────────────────────────────────────────
class _Stepper extends StatelessWidget {
  final String current;
  const _Stepper({required this.current});

  @override
  Widget build(BuildContext context) {
    final idx = _steps.indexOf(current);

    return Row(
      children: List.generate(_steps.length * 2 - 1, (i) {
        if (i.isOdd) {
          final filled = idx > (i - 1) ~/ 2;
          return Expanded(
            child: Container(
              height: 2,
              color: filled
                  ? _primary.withValues(alpha: 0.5)
                  : Colors.grey.shade200,
            ),
          );
        }

        final si      = i ~/ 2;
        final isDone  = idx > si;
        final isCur   = idx == si;
        final dotCol  = isDone || isCur ? _primary : Colors.grey.shade300;

        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 22, height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isDone
                    ? _primary
                    : isCur
                        ? _primary.withValues(alpha: 0.15)
                        : Colors.grey.shade200,
                border:
                    Border.all(color: dotCol, width: isCur ? 2 : 1.5),
              ),
              child: isDone
                  ? const Icon(Icons.check_rounded,
                      color: Colors.white, size: 12)
                  : isCur
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
              _stepLabels[si],
              style: TextStyle(
                fontSize: 8.5,
                fontWeight:
                    isCur ? FontWeight.w800 : FontWeight.w500,
                color: isCur ? _primary : Colors.grey.shade400,
              ),
            ),
          ],
        );
      }),
    );
  }
}
