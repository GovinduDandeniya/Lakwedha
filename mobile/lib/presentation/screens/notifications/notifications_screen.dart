import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../../data/datasources/remote/api_service.dart';

// ── Notification type metadata ────────────────────────────────────────────────

enum _Tab { all, booking, payment, reminder }

class _TypeMeta {
  final IconData icon;
  final Color color;
  const _TypeMeta(this.icon, this.color);
}

const _typeMeta = <String, _TypeMeta>{
  'BOOKING':            _TypeMeta(Icons.calendar_month_rounded,      Color(0xFF2E7D32)),
  'CHANNEL_CONFIRMED':  _TypeMeta(Icons.how_to_reg_rounded,          Color(0xFF1565C0)),
  'REMINDER':           _TypeMeta(Icons.alarm_rounded,               Color(0xFFE65100)),
  'STATUS_UPDATE':      _TypeMeta(Icons.update_rounded,              Color(0xFF6A1B9A)),
  'SLOT_AVAILABLE':     _TypeMeta(Icons.event_available_rounded,     Color(0xFF00695C)),
  'SESSION_CANCELLED':  _TypeMeta(Icons.event_busy_rounded,          Color(0xFFC62828)),
  'PAYMENT_CONFIRMED':  _TypeMeta(Icons.check_circle_rounded,        Color(0xFF2E7D32)),
  'PAYMENT_FAILED':     _TypeMeta(Icons.credit_card_off_rounded,     Color(0xFFC62828)),
  'EMERGENCY_APPROVED': _TypeMeta(Icons.emergency_rounded,           Color(0xFF2E7D32)),
  'EMERGENCY_REJECTED': _TypeMeta(Icons.cancel_rounded,              Color(0xFFC62828)),
};

const _fallbackMeta = _TypeMeta(Icons.notifications_active_rounded, Color(0xFF2E7D32));

_TypeMeta _meta(String? type) => _typeMeta[type?.toUpperCase()] ?? _fallbackMeta;

bool _isPaymentType(String? t) {
  final u = t?.toUpperCase() ?? '';
  return u == 'PAYMENT_CONFIRMED' || u == 'PAYMENT_FAILED';
}

bool _isBookingType(String? t) {
  final u = t?.toUpperCase() ?? '';
  return u == 'BOOKING' || u == 'CHANNEL_CONFIRMED' || u == 'STATUS_UPDATE' ||
      u == 'SLOT_AVAILABLE' || u == 'SESSION_CANCELLED' ||
      u == 'EMERGENCY_APPROVED' || u == 'EMERGENCY_REJECTED';
}

bool _isReminderType(String? t) =>
    (t?.toUpperCase() ?? '') == 'REMINDER';

// ── Screen ────────────────────────────────────────────────────────────────────

class NotificationsScreen extends StatefulWidget {
  final VoidCallback? onUnreadChanged;
  const NotificationsScreen({super.key, this.onUnreadChanged});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen>
    with SingleTickerProviderStateMixin {
  static const Color _primary = Color(0xFF2E7D32);

  final ApiService _api = ApiService();
  late final TabController _tabCtrl;

  List<Map<String, dynamic>> _notifications = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 4, vsync: this);
    _fetchNotifications();
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchNotifications() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await _api.getPatientNotifications();
      setState(() { _notifications = data; _loading = false; });
      widget.onUnreadChanged?.call();
    } catch (e) {
      setState(() { _error = 'Could not load notifications. Pull down to retry.'; _loading = false; });
    }
  }

  Future<void> _markRead(String id) async {
    try {
      await _api.markNotificationRead(id);
      setState(() {
        final idx = _notifications.indexWhere(
            (n) => (n['_id'] ?? n['id'])?.toString() == id);
        if (idx != -1) _notifications[idx] = {..._notifications[idx], 'read': true};
      });
      widget.onUnreadChanged?.call();
    } catch (_) {}
  }

  Future<void> _markAllRead() async {
    try {
      await _api.markAllNotificationsRead();
      setState(() {
        _notifications = _notifications.map((n) => {...n, 'read': true}).toList();
      });
      widget.onUnreadChanged?.call();
    } catch (_) {}
  }

  Future<void> _delete(String id) async {
    try {
      await _api.deleteNotification(id);
      setState(() {
        _notifications.removeWhere((n) => (n['_id'] ?? n['id'])?.toString() == id);
      });
      widget.onUnreadChanged?.call();
    } catch (_) {}
  }

  int get _unreadCount => _notifications.where((n) => n['read'] == false).length;

  List<Map<String, dynamic>> _filtered(_Tab tab) {
    return switch (tab) {
      _Tab.all     => _notifications,
      _Tab.booking => _notifications.where((n) => _isBookingType(n['type'] as String?)).toList(),
      _Tab.payment => _notifications.where((n) => _isPaymentType(n['type'] as String?)).toList(),
      _Tab.reminder => _notifications.where((n) => _isReminderType(n['type'] as String?)).toList(),
    };
  }

  // ── Build ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final isGuest = Provider.of<AuthProvider>(context, listen: false).isGuest;
    if (isGuest) return _guestView();

    return Scaffold(
      backgroundColor: const Color(0xFFF0F4F8),
      appBar: _appBar(),
      body: RefreshIndicator(
        color: _primary,
        onRefresh: _fetchNotifications,
        child: _buildBody(),
      ),
    );
  }

  PreferredSizeWidget _appBar() {
    return AppBar(
      backgroundColor: _primary,
      elevation: 0,
      title: Row(
        children: [
          const Text('Notifications',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 18)),
          if (_unreadCount > 0) ...[
            const SizedBox(width: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.25),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text('$_unreadCount new',
                  style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
            ),
          ],
        ],
      ),
      actions: [
        if (_unreadCount > 0)
          TextButton(
            onPressed: _markAllRead,
            child: const Text('Mark all read',
                style: TextStyle(color: Colors.white70, fontSize: 13)),
          ),
      ],
      bottom: TabBar(
        controller: _tabCtrl,
        indicatorColor: Colors.white,
        indicatorWeight: 3,
        labelColor: Colors.white,
        unselectedLabelColor: Colors.white54,
        labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
        unselectedLabelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
        tabs: [
          _buildTab('All', _unreadCountFor(_Tab.all)),
          _buildTab('Booking', _unreadCountFor(_Tab.booking)),
          _buildTab('Payment', _unreadCountFor(_Tab.payment)),
          _buildTab('Reminder', _unreadCountFor(_Tab.reminder)),
        ],
      ),
    );
  }

  Tab _buildTab(String label, int unread) {
    return Tab(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Flexible(child: Text(label, overflow: TextOverflow.ellipsis)),
          if (unread > 0) ...[
            const SizedBox(width: 5),
            Container(
              width: 16,
              height: 16,
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text('$unread',
                    style: const TextStyle(
                        color: _primary, fontSize: 9, fontWeight: FontWeight.w900)),
              ),
            ),
          ],
        ],
      ),
    );
  }

  int _unreadCountFor(_Tab tab) =>
      _filtered(tab).where((n) => n['read'] == false).length;

  Widget _buildBody() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: _primary));
    }
    if (_error != null) {
      return ListView(children: [
        const SizedBox(height: 80),
        Center(child: Column(children: [
          const Icon(Icons.wifi_off_rounded, size: 56, color: Colors.grey),
          const SizedBox(height: 12),
          Text(_error!, textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.grey, fontSize: 14)),
        ])),
      ]);
    }

    return TabBarView(
      controller: _tabCtrl,
      children: [
        _tabContent(_Tab.all),
        _tabContent(_Tab.booking),
        _tabContent(_Tab.payment),
        _tabContent(_Tab.reminder),
      ],
    );
  }

  Widget _tabContent(_Tab tab) {
    final items = _filtered(tab);
    if (items.isEmpty) return _emptyState(tab);

    // Group by date
    final groups = _groupByDate(items);

    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
      itemCount: groups.length,
      itemBuilder: (context, i) {
        final group = groups[i];
        final label = group['label'] as String;
        final notifs = group['items'] as List<Map<String, dynamic>>;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: EdgeInsets.only(left: 4, bottom: 8, top: i == 0 ? 0 : 12),
              child: Text(
                label,
                style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: Colors.grey[500],
                    letterSpacing: 0.8),
              ),
            ),
            ...notifs.asMap().entries.map((entry) {
              final idx = entry.key;
              final n = entry.value;
              return Padding(
                padding: EdgeInsets.only(bottom: idx < notifs.length - 1 ? 8 : 0),
                child: _notifTile(n),
              );
            }),
          ],
        );
      },
    );
  }

  Widget _notifTile(Map<String, dynamic> n) {
    final id = (n['_id'] ?? n['id'])?.toString() ?? '';
    final bool isRead = n['read'] == true;
    final type = n['type'] as String?;
    final meta = _meta(type);
    final isError = type?.toUpperCase() == 'PAYMENT_FAILED' ||
        type?.toUpperCase() == 'SESSION_CANCELLED' ||
        type?.toUpperCase() == 'EMERGENCY_REJECTED';

    return Dismissible(
      key: Key(id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          color: const Color(0xFFEF5350),
          borderRadius: BorderRadius.circular(14),
        ),
        child: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.delete_outline_rounded, color: Colors.white, size: 22),
            SizedBox(height: 2),
            Text('Delete', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700)),
          ],
        ),
      ),
      onDismissed: (_) => _delete(id),
      child: GestureDetector(
        onTap: () {
          if (!isRead) _markRead(id);
          _showDetail(context, n);
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          decoration: BoxDecoration(
            color: isRead ? Colors.white : meta.color.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isRead
                  ? const Color(0xFFE8EDF2)
                  : meta.color.withValues(alpha: 0.3),
              width: 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Type icon
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: meta.color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(meta.icon, color: meta.color, size: 22),
                ),
                const SizedBox(width: 12),
                // Content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              n['title'] as String? ?? 'Notification',
                              style: TextStyle(
                                fontWeight: isRead ? FontWeight.w600 : FontWeight.w800,
                                fontSize: 13.5,
                                color: isError ? const Color(0xFFC62828) : const Color(0xFF1A1A1A),
                              ),
                            ),
                          ),
                          if (!isRead)
                            Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(color: meta.color, shape: BoxShape.circle),
                            ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        n['message'] as String? ?? '',
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 12.5, color: Colors.grey[600], height: 1.4),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Icon(Icons.access_time_rounded, size: 11, color: Colors.grey[400]),
                          const SizedBox(width: 3),
                          Text(
                            _formatDate(n['createdAt'] as String?),
                            style: TextStyle(fontSize: 11, color: Colors.grey[400]),
                          ),
                          const Spacer(),
                          _typeBadge(type),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _typeBadge(String? type) {
    final label = _badgeLabel(type);
    if (label == null) return const SizedBox.shrink();
    final meta = _meta(type);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: meta.color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(label,
          style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w700, color: meta.color)),
    );
  }

  String? _badgeLabel(String? type) => switch (type?.toUpperCase()) {
    'BOOKING'            => 'BOOKED',
    'CHANNEL_CONFIRMED'  => 'CHANNEL',
    'REMINDER'           => 'REMINDER',
    'STATUS_UPDATE'      => 'UPDATE',
    'SLOT_AVAILABLE'     => 'SLOT',
    'SESSION_CANCELLED'  => 'CANCELLED',
    'PAYMENT_CONFIRMED'  => 'PAID',
    'PAYMENT_FAILED'     => 'FAILED',
    'EMERGENCY_APPROVED' => 'APPROVED',
    'EMERGENCY_REJECTED' => 'REJECTED',
    _ => null,
  };

  // ── Detail bottom sheet ───────────────────────────────────────────────────

  void _showDetail(BuildContext context, Map<String, dynamic> n) {
    final type = n['type'] as String?;
    final meta = _meta(type);
    final isError = type?.toUpperCase() == 'PAYMENT_FAILED' ||
        type?.toUpperCase() == 'SESSION_CANCELLED' ||
        type?.toUpperCase() == 'EMERGENCY_REJECTED';

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40, height: 4,
                decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: meta.color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(meta.icon, color: meta.color, size: 28),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        n['title'] as String? ?? 'Notification',
                        style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                            color: isError ? const Color(0xFFC62828) : const Color(0xFF1A1A1A)),
                      ),
                      const SizedBox(height: 2),
                      if (type != null) _typeBadge(type),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFF8F9FA),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                n['message'] as String? ?? '',
                style: const TextStyle(fontSize: 14, height: 1.6, color: Color(0xFF333333)),
              ),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Icon(Icons.access_time_rounded, size: 14, color: Colors.grey[400]),
                const SizedBox(width: 4),
                Text(
                  _formatDateFull(n['createdAt'] as String?),
                  style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                ),
              ],
            ),
            const SizedBox(height: 22),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: meta.color,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  elevation: 0,
                ),
                child: const Text('Close', style: TextStyle(fontWeight: FontWeight.w700, color: Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────

  Widget _emptyState(_Tab tab) {
    final (IconData icon, String title, String sub) = switch (tab) {
      _Tab.booking  => (Icons.calendar_month_outlined,    'No Booking Alerts', 'Appointment confirmations\nand updates will appear here.'),
      _Tab.payment  => (Icons.receipt_long_outlined,      'No Payment Alerts', 'Payment confirmations\nand failures will appear here.'),
      _Tab.reminder => (Icons.alarm_off_rounded,          'No Reminders',      'Appointment reminders\nwill appear 12 hours before.'),
      _Tab.all      => (Icons.notifications_none_rounded, 'No Notifications',  'You\'ll see all alerts\nright here when they arrive.'),
    };
    return ListView(children: [
      const SizedBox(height: 80),
      Center(
        child: Column(
          children: [
            Icon(icon, size: 64, color: Colors.grey[300]),
            const SizedBox(height: 16),
            Text(title,
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: Colors.grey)),
            const SizedBox(height: 8),
            Text(sub,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: Colors.grey[500], height: 1.5)),
          ],
        ),
      ),
    ]);
  }

  // ── Guest view ────────────────────────────────────────────────────────────

  Widget _guestView() {
    return Scaffold(
      backgroundColor: const Color(0xFFF0F4F8),
      appBar: AppBar(
        backgroundColor: _primary,
        title: const Text('Notifications', style: TextStyle(color: Colors.white)),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.notifications_off_outlined, size: 72, color: Colors.grey[350]),
              const SizedBox(height: 20),
              const Text('Sign in to see your alerts',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Color(0xFF1C2B2C))),
              const SizedBox(height: 8),
              Text('Appointment updates and payment alerts will appear here after you sign in.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, color: Colors.grey[600], height: 1.5)),
              const SizedBox(height: 28),
              ElevatedButton(
                onPressed: () => Navigator.pushReplacementNamed(context, '/sign-up'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _primary,
                  minimumSize: const Size(double.infinity, 48),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Create an Account', style: TextStyle(color: Colors.white)),
              ),
              const SizedBox(height: 10),
              OutlinedButton(
                onPressed: () => Navigator.pushReplacementNamed(context, '/sign-in'),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 48),
                  side: const BorderSide(color: _primary),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Sign In', style: TextStyle(color: _primary)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Date grouping ─────────────────────────────────────────────────────────

  List<Map<String, dynamic>> _groupByDate(List<Map<String, dynamic>> items) {
    final now = DateTime.now();
    final todayStart = DateTime(now.year, now.month, now.day);
    final yesterdayStart = todayStart.subtract(const Duration(days: 1));
    final weekStart = todayStart.subtract(const Duration(days: 6));

    final Map<String, List<Map<String, dynamic>>> buckets = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'Earlier': [],
    };

    for (final n in items) {
      final raw = n['createdAt'] as String?;
      DateTime dt;
      try { dt = DateTime.parse(raw ?? '').toLocal(); } catch (_) { dt = now; }

      if (!dt.isBefore(todayStart)) {
        buckets['Today']!.add(n);
      } else if (!dt.isBefore(yesterdayStart)) {
        buckets['Yesterday']!.add(n);
      } else if (!dt.isBefore(weekStart)) {
        buckets['This Week']!.add(n);
      } else {
        buckets['Earlier']!.add(n);
      }
    }

    return buckets.entries
        .where((e) => e.value.isNotEmpty)
        .map((e) => {'label': e.key, 'items': e.value})
        .toList();
  }

  // ── Date helpers ──────────────────────────────────────────────────────────

  String _formatDate(String? iso) {
    if (iso == null) return '';
    try {
      final dt = DateTime.parse(iso).toLocal();
      final now = DateTime.now();
      final diff = now.difference(dt);
      if (diff.inMinutes < 1) return 'Just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      if (diff.inDays < 7) return '${diff.inDays}d ago';
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (_) { return iso; }
  }

  String _formatDateFull(String? iso) {
    if (iso == null) return '';
    try {
      final dt = DateTime.parse(iso).toLocal();
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      final h = dt.hour > 12 ? dt.hour - 12 : (dt.hour == 0 ? 12 : dt.hour);
      final m = dt.minute.toString().padLeft(2, '0');
      final ampm = dt.hour >= 12 ? 'PM' : 'AM';
      return '${months[dt.month - 1]} ${dt.day}, ${dt.year}  $h:$m $ampm';
    } catch (_) { return iso; }
  }
}
