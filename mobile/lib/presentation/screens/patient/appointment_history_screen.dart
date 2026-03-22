import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/appointment_provider.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/utils/date_formatter.dart';
import '../../../data/models/appointment_model.dart';
import 'doctor_search_screen.dart';

class AppointmentHistoryScreen extends StatefulWidget {
  const AppointmentHistoryScreen({super.key});

  @override
  State<AppointmentHistoryScreen> createState() => _AppointmentHistoryScreenState();
}

class _AppointmentHistoryScreenState extends State<AppointmentHistoryScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AppointmentProvider>(context, listen: false).loadAppointments();
    });
  }

  @override
  Widget build(BuildContext context) {
    final isGuest = Provider.of<AuthProvider>(context, listen: false).isGuest;
    if (isGuest) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('My Appointments'),
          backgroundColor: AppConstants.primaryColor,
          foregroundColor: Colors.white,
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.lock_outline_rounded, size: 72, color: Colors.grey[350]),
                const SizedBox(height: 20),
                const Text('Sign in to view your appointments',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Color(0xFF1C2B2C))),
                const SizedBox(height: 8),
                Text('Create an account or sign in to track your booking history.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, color: Colors.grey[600], height: 1.5)),
                const SizedBox(height: 28),
                ElevatedButton(
                  onPressed: () => Navigator.pushReplacementNamed(context, '/sign-up'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppConstants.primaryColor,
                    minimumSize: const Size(double.infinity, 48),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Create an Account'),
                ),
                const SizedBox(height: 10),
                OutlinedButton(
                  onPressed: () => Navigator.pushReplacementNamed(context, '/sign-in'),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(double.infinity, 48),
                    side: const BorderSide(color: AppConstants.primaryColor),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Sign In', style: TextStyle(color: AppConstants.primaryColor)),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Appointments'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              Provider.of<AppointmentProvider>(context, listen: false).loadAppointments();
            },
          ),
        ],
      ),
      body: Consumer<AppointmentProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
                  const SizedBox(height: 16),
                  Text(
                    'Error loading appointments',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 8),
                  Text(provider.error!),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => provider.loadAppointments(),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          return DefaultTabController(
            length: 2,
            child: Column(
              children: [
                const TabBar(
                  tabs: [
                    Tab(text: 'Upcoming'),
                    Tab(text: 'Past'),
                  ],
                  labelColor: AppConstants.primaryColor,
                  unselectedLabelColor: Colors.grey,
                  indicatorColor: AppConstants.primaryColor,
                ),
                Expanded(
                  child: TabBarView(
                    children: [
                      _buildAppointmentList(provider.upcomingAppointments, true),
                      _buildAppointmentList(provider.pastAppointments, false),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  static const List<String> _cancelReasons = [
    'Feeling better',
    'Emergency',
    'Doctor unavailable',
    'Personal issue',
    'Change of plans',
    'Other',
  ];

  void _showCancelSheet(BuildContext context, Appointment appointment) {
    String? selectedReason;
    bool loading = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetCtx) {
        return StatefulBuilder(
          builder: (ctx, setState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 24, right: 24, top: 24,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header
                  Row(
                    children: [
                      const Icon(Icons.cancel_outlined, color: Colors.deepOrange),
                      const SizedBox(width: 8),
                      const Text('Cancel Appointment',
                        style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                      const Spacer(),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(sheetCtx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),

                  // Warnings
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.orange.shade50,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.orange.shade200),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _warningRow(Icons.percent, '10% cancellation fee will be charged'),
                        const SizedBox(height: 4),
                        _warningRow(Icons.access_time, 'Cancellation only allowed ≥ 12 hours before appointment'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Reason dropdown
                  const Text('Reason for cancellation',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    // ignore: deprecated_member_use
                    value: selectedReason,
                    hint: const Text('Select a reason'),
                    decoration: InputDecoration(
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    ),
                    items: _cancelReasons.map((r) => DropdownMenuItem(
                      value: r, child: Text(r, style: const TextStyle(fontSize: 14)),
                    )).toList(),
                    onChanged: (v) => setState(() => selectedReason = v),
                  ),
                  const SizedBox(height: 20),

                  // Submit button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: loading || selectedReason == null ? null : () async {
                        setState(() => loading = true);
                        final error = await Provider.of<AppointmentProvider>(
                          context, listen: false,
                        ).requestCancellation(appointment.id, selectedReason!);
                        if (!sheetCtx.mounted) return;
                        Navigator.pop(sheetCtx);
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                          content: Text(error ?? 'Cancellation request sent to admin'),
                          backgroundColor: error != null ? Colors.red : Colors.green,
                        ));
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.deepOrange,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: loading
                          ? const SizedBox(height: 18, width: 18,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text('Submit Cancellation Request',
                              style: TextStyle(fontWeight: FontWeight.w600)),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _warningRow(IconData icon, String text) => Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Icon(icon, size: 14, color: Colors.orange.shade700),
      const SizedBox(width: 6),
      Expanded(child: Text(text,
        style: TextStyle(fontSize: 12, color: Colors.orange.shade800))),
    ],
  );

  Widget _buildAppointmentList(List<Appointment> appointments, bool isUpcoming) {
    if (appointments.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.calendar_today,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'No ${isUpcoming ? 'upcoming' : 'past'} appointments',
              style: TextStyle(color: Colors.grey[600], fontSize: 16),
            ),
            if (isUpcoming) ...[
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (_) => const DoctorSearchScreen()),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppConstants.primaryColor,
                ),
                child: const Text('Book an Appointment'),
              ),
            ],
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: appointments.length,
      itemBuilder: (context, index) {
        final appointment = appointments[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 25,
                      backgroundColor: Colors.green[100],
                      child: const Icon(Icons.person, color: Colors.green),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            appointment.doctorDetails?.name ?? 'Doctor',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            appointment.doctorDetails?.specialization ?? '',
                            style: TextStyle(color: Colors.grey[600]),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: appointment.status.color.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: appointment.status.color),
                      ),
                      child: Text(
                        appointment.status.display,
                        style: TextStyle(
                          color: appointment.status.color,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const Divider(height: 24),
                Row(
                  children: [
                    const Icon(Icons.calendar_today, size: 16, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text(
                      DateFormatter.formatDate(appointment.slotTime),
                      style: TextStyle(color: Colors.grey[600]),
                    ),
                    const SizedBox(width: 16),
                    const Icon(Icons.access_time, size: 16, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text(
                      DateFormatter.formatTime(appointment.slotTime),
                      style: TextStyle(color: Colors.grey[600]),
                    ),
                  ],
                ),
                if (appointment.symptoms != null) ...[
                  const SizedBox(height: 8),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.note, size: 16, color: Colors.grey),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          appointment.symptoms!,
                          style: TextStyle(color: Colors.grey[600]),
                        ),
                      ),
                    ],
                  ),
                ],
                // Cancel button — shown for active upcoming appointments
                if (isUpcoming &&
                    (appointment.status == AppointmentStatus.confirmed ||
                     appointment.status == AppointmentStatus.pending)) ...[
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () => _showCancelSheet(context, appointment),
                      icon: const Icon(Icons.cancel_outlined, size: 16),
                      label: const Text('Request Cancellation'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.deepOrange,
                        side: const BorderSide(color: Colors.deepOrange),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                    ),
                  ),
                ],

                // Cancel-requested info chip
                if (appointment.status == AppointmentStatus.cancelRequested) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.deepOrange.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.deepOrange.shade200),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.hourglass_top, size: 14, color: Colors.deepOrange.shade700),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            'Cancellation request pending admin approval',
                            style: TextStyle(fontSize: 12, color: Colors.deepOrange.shade700),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                if (!isUpcoming && appointment.status == AppointmentStatus.completed) ...[
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                            showDialog(
                              context: context,
                              builder: (_) => AlertDialog(
                                title: const Text('Appointment Details'),
                                content: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                        'Doctor: ${appointment.doctorDetails?.name ?? 'N/A'}'),
                                    const SizedBox(height: 8),
                                    Text(
                                        'Date: ${DateFormatter.formatDate(appointment.slotTime)}'),
                                    const SizedBox(height: 8),
                                    Text(
                                        'Time: ${DateFormatter.formatTime(appointment.slotTime)}'),
                                    const SizedBox(height: 8),
                                    Text(
                                        'Status: ${appointment.status.display}'),
                                    if (appointment.symptoms != null) ...[
                                      const SizedBox(height: 8),
                                      Text(
                                          'Symptoms: ${appointment.symptoms}'),
                                    ],
                                  ],
                                ),
                                actions: [
                                  TextButton(
                                    onPressed: () => Navigator.pop(context),
                                    child: const Text('Close'),
                                  ),
                                ],
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppConstants.primaryColor,
                          ),
                          child: const Text('View Details'),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }

}