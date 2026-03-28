import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'pdf_download_helper.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import '../../../data/models/doctor_availability_model.dart';
import '../../../data/models/doctor_model.dart';

const Color _primary = Color(0xFF2E7D32);
const Color _bg = Color(0xFFF4FAF4);

class PaymentSuccessScreen extends StatelessWidget {
  final Doctor doctor;
  final HospitalAvailability hospital;
  final DateSlotSummary slot;
  final int appointmentNumber;
  final Map<String, dynamic> patient;
  final double doctorFee;
  final double hospitalCharge;
  final double channelingCharge;
  final double totalAmount;
  final String transactionId;
  final String paymentMethod;
  final DateTime paidAt;

  const PaymentSuccessScreen({
    super.key,
    required this.doctor,
    required this.hospital,
    required this.slot,
    required this.appointmentNumber,
    required this.patient,
    required this.doctorFee,
    required this.hospitalCharge,
    required this.channelingCharge,
    required this.totalAmount,
    required this.transactionId,
    required this.paymentMethod,
    required this.paidAt,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: const Text(
          'Booking Confirmed',
          style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
        ),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1A1A2E),
        elevation: 0,
        centerTitle: true,
        surfaceTintColor: Colors.transparent,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 40),
        children: [
          // ── Success header ──────────────────────────────────────────────
          _successHeader(),
          const SizedBox(height: 24),

          // ── Receipt card ────────────────────────────────────────────────
          _receiptCard(),
          const SizedBox(height: 24),

          // ── Action buttons ──────────────────────────────────────────────
          _actionButtons(context),
        ],
      ),
    );
  }

  // ── Success header ──────────────────────────────────────────────────────────

  Widget _successHeader() {
    return Column(
      children: [
        Container(
          width: 88,
          height: 88,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF43A047), _primary],
            ),
            boxShadow: [
              BoxShadow(
                color: _primary.withValues(alpha: 0.35),
                blurRadius: 20,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: const Icon(Icons.check_rounded, size: 48, color: Colors.white),
        ),
        const SizedBox(height: 16),
        const Text(
          'Payment Successful',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1A1A2E),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'Your appointment has been confirmed',
          style: TextStyle(fontSize: 13, color: Colors.grey[500]),
        ),
      ],
    );
  }

  // ── Receipt card ────────────────────────────────────────────────────────────

  Widget _receiptCard() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.07),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Green gradient header with receipt title + appt number
          Container(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [_primary, Color(0xFF43A047)],
              ),
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Row(
              children: [
                const Icon(Icons.receipt_long_rounded,
                    color: Colors.white, size: 20),
                const SizedBox(width: 10),
                const Expanded(
                  child: Text(
                    'RECEIPT',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      letterSpacing: 1,
                    ),
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '$appointmentNumber',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: _primary,
                          height: 1,
                        ),
                      ),
                      const Text(
                        'Appt No.',
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w600,
                          color: _primary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Dashed divider
          _dashedDivider(),

          // Appointment details section
          _receiptSection(
            'APPOINTMENT DETAILS',
            [
              _receiptRow('Doctor', doctor.name),
              _receiptRow('Specialization', doctor.specialization),
              _receiptRow('Hospital', hospital.hospitalName),
              if (hospital.location.isNotEmpty)
                _receiptRow('Location', hospital.location),
              _receiptRow('Date', _fmtDate(slot.date)),
              _receiptRow('Time', slot.startTime),
            ],
          ),

          _dashedDivider(),

          // Patient details section
          _receiptSection(
            'PATIENT DETAILS',
            [
              _receiptRow('Name',
                  '${patient['title']} ${patient['name']}'),
              _receiptRow('Email', patient['email'] as String),
              _receiptRow('Telephone', patient['phone'] as String),
              _receiptRow(patient['idType'] as String,
                  patient['idNumber'] as String),
            ],
          ),

          _dashedDivider(),

          // Payment breakdown section
          _receiptSection(
            'PAYMENT BREAKDOWN',
            [
              _receiptRow('Doctor Fee',
                  'LKR ${doctorFee.toStringAsFixed(2)}'),
              _receiptRow('Hospital Charge',
                  'LKR ${hospitalCharge.toStringAsFixed(2)}'),
              _receiptRow('Channeling Charge',
                  'LKR ${channelingCharge.toStringAsFixed(2)}'),
            ],
          ),

          // Total row
          Container(
            margin: const EdgeInsets.fromLTRB(16, 0, 16, 0),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFE8F5E9),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Total Paid',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: _primary,
                  ),
                ),
                Text(
                  'LKR ${totalAmount.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: _primary,
                  ),
                ),
              ],
            ),
          ),

          _dashedDivider(),

          // Transaction details section
          _receiptSection(
            'TRANSACTION DETAILS',
            [
              _receiptRow('Transaction ID', transactionId),
              _receiptRow('Payment Method', paymentMethod),
              _receiptRow('Date & Time', _fmtDateTime(paidAt)),
              _receiptRow('Status', 'Paid'),
            ],
            lastStatusGreen: true,
          ),

          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _receiptSection(
    String title,
    List<Widget> rows, {
    bool lastStatusGreen = false,
  }) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              color: Color(0xFF9E9E9E),
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 10),
          ...rows,
        ],
      ),
    );
  }

  Widget _receiptRow(String label, String value, {bool isGreen = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 7),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                color: Color(0xFF9E9E9E),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: (label == 'Status' || isGreen)
                    ? _primary
                    : const Color(0xFF1A1A2E),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _dashedDivider() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: LayoutBuilder(
        builder: (_, constraints) {
          final dashes = (constraints.maxWidth / 8).floor();
          return Row(
            children: List.generate(
              dashes,
              (_) => Expanded(
                child: Container(
                  height: 1,
                  margin: const EdgeInsets.symmetric(horizontal: 2),
                  color: const Color(0xFFEEEEEE),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  // ── Action buttons ──────────────────────────────────────────────────────────

  Widget _actionButtons(BuildContext context) {
    return Column(
      children: [
        // Download Receipt (PDF)
        SizedBox(
          width: double.infinity,
          height: 52,
          child: OutlinedButton.icon(
            onPressed: () => _downloadPdf(context),
            icon: const Icon(Icons.download_rounded, size: 20),
            label: const Text(
              'Download Receipt (PDF)',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
            ),
            style: OutlinedButton.styleFrom(
              foregroundColor: _primary,
              side: const BorderSide(color: _primary, width: 1.5),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Send via email
        SizedBox(
          width: double.infinity,
          height: 52,
          child: OutlinedButton.icon(
            onPressed: () => _sendEmail(context),
            icon: const Icon(Icons.email_outlined, size: 20),
            label: const Text(
              'Send Receipt via Email',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
            ),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFF1565C0),
              side:
                  const BorderSide(color: Color(0xFF1565C0), width: 1.5),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Go to Home
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton.icon(
            onPressed: () =>
                Navigator.of(context).popUntil((r) => r.isFirst),
            icon: const Icon(Icons.home_rounded, size: 20),
            label: const Text(
              'Go to Home',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: _primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
              elevation: 0,
            ),
          ),
        ),
      ],
    );
  }

  // ── PDF generation ──────────────────────────────────────────────────────────

  Future<void> _downloadPdf(BuildContext context) async {
    final pdf = pw.Document();

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(32),
        build: (pw.Context ctx) => [
          // Header
          pw.Container(
            padding: const pw.EdgeInsets.all(16),
            decoration: pw.BoxDecoration(
              color: PdfColors.green800,
              borderRadius: pw.BorderRadius.circular(8),
            ),
            child: pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text('APPOINTMENT RECEIPT',
                        style: pw.TextStyle(
                            color: PdfColors.white,
                            fontSize: 16,
                            fontWeight: pw.FontWeight.bold)),
                    pw.SizedBox(height: 4),
                    pw.Text('Lakwedha Healthcare',
                        style: const pw.TextStyle(
                            color: PdfColor(1, 1, 1, 0.75), fontSize: 11)),
                  ],
                ),
                pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.end,
                  children: [
                    pw.Text('Appt No. $appointmentNumber',
                        style: pw.TextStyle(
                            color: PdfColors.white,
                            fontSize: 14,
                            fontWeight: pw.FontWeight.bold)),
                    pw.SizedBox(height: 4),
                    pw.Text(transactionId,
                        style: const pw.TextStyle(
                            color: PdfColor(1, 1, 1, 0.75), fontSize: 10)),
                  ],
                ),
              ],
            ),
          ),
          pw.SizedBox(height: 20),

          // Appointment Details
          _pdfSection('APPOINTMENT DETAILS', [
            _pdfRow('Doctor', doctor.name),
            _pdfRow('Specialization', doctor.specialization),
            _pdfRow('Hospital', hospital.hospitalName),
            if (hospital.location.isNotEmpty)
              _pdfRow('Location', hospital.location),
            _pdfRow('Date', _fmtDate(slot.date)),
            _pdfRow('Time', slot.startTime),
          ]),
          pw.SizedBox(height: 16),

          // Patient Details
          _pdfSection('PATIENT DETAILS', [
            _pdfRow('Name', '${patient['title']} ${patient['name']}'),
            _pdfRow('Email', patient['email'] as String),
            _pdfRow('Telephone', patient['phone'] as String),
            _pdfRow(patient['idType'] as String, patient['idNumber'] as String),
          ]),
          pw.SizedBox(height: 16),

          // Payment Breakdown
          _pdfSection('PAYMENT BREAKDOWN', [
            _pdfRow('Doctor Fee', 'LKR ${doctorFee.toStringAsFixed(2)}'),
            _pdfRow('Hospital Charge',
                'LKR ${hospitalCharge.toStringAsFixed(2)}'),
            _pdfRow('Channeling Charge',
                'LKR ${channelingCharge.toStringAsFixed(2)}'),
          ]),
          pw.SizedBox(height: 8),

          // Total
          pw.Container(
            padding: const pw.EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: pw.BoxDecoration(
              color: PdfColors.green50,
              border: pw.Border.all(color: PdfColors.green800),
              borderRadius: pw.BorderRadius.circular(6),
            ),
            child: pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Text('Total Paid',
                    style: pw.TextStyle(
                        fontWeight: pw.FontWeight.bold, fontSize: 13)),
                pw.Text('LKR ${totalAmount.toStringAsFixed(2)}',
                    style: pw.TextStyle(
                        fontWeight: pw.FontWeight.bold,
                        fontSize: 14,
                        color: PdfColors.green800)),
              ],
            ),
          ),
          pw.SizedBox(height: 16),

          // Transaction Details
          _pdfSection('TRANSACTION DETAILS', [
            _pdfRow('Transaction ID', transactionId),
            _pdfRow('Payment Method', paymentMethod),
            _pdfRow('Date & Time', _fmtDateTime(paidAt)),
            _pdfRow('Status', 'PAID'),
          ]),
          pw.SizedBox(height: 24),

          // Footer
          pw.Center(
            child: pw.Text(
              'Thank you for choosing Lakwedha Healthcare.',
              style: const pw.TextStyle(
                  color: PdfColors.grey600, fontSize: 11),
            ),
          ),
        ],
      ),
    );

    final Uint8List bytes = await pdf.save();
    try {
      await downloadPdfBytes(bytes, 'receipt_$transactionId.pdf');
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Receipt download started'),
            backgroundColor: _primary,
            behavior: SnackBarBehavior.floating,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('PDF download is only available on the web app.'),
            backgroundColor: Colors.orange,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  pw.Widget _pdfSection(String title, List<pw.Widget> rows) {
    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Container(
          width: double.infinity,
          padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          decoration: const pw.BoxDecoration(color: PdfColors.grey200),
          child: pw.Text(
            title,
            style: pw.TextStyle(
                fontSize: 10,
                fontWeight: pw.FontWeight.bold,
                color: PdfColors.grey700),
          ),
        ),
        pw.SizedBox(height: 4),
        ...rows,
      ],
    );
  }

  pw.Widget _pdfRow(String label, String value) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      child: pw.Row(
        children: [
          pw.SizedBox(
            width: 130,
            child: pw.Text(label,
                style: const pw.TextStyle(
                    fontSize: 11, color: PdfColors.grey600)),
          ),
          pw.Expanded(
            child: pw.Text(value,
                style: pw.TextStyle(
                    fontSize: 11, fontWeight: pw.FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  // ── Email (placeholder) ─────────────────────────────────────────────────────

  void _sendEmail(BuildContext context) {
    final email = patient['email'] as String;
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        contentPadding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: const BoxDecoration(
                color: Color(0xFFE3F2FD),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.email_rounded,
                  size: 28, color: Color(0xFF1565C0)),
            ),
            const SizedBox(height: 14),
            const Text(
              'Email Receipt',
              style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1A1A2E)),
            ),
            const SizedBox(height: 8),
            Text(
              'A receipt will be sent to\n$email\nonce email notifications are enabled.',
              textAlign: TextAlign.center,
              style:
                  const TextStyle(fontSize: 13, color: Color(0xFF666666), height: 1.5),
            ),
            const SizedBox(height: 18),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1565C0),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                child: const Text('OK',
                    style: TextStyle(fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  static String _fmtDate(String dateStr) {
    final parts = dateStr.split('-');
    if (parts.length != 3) return dateStr;
    try {
      final d = DateTime(
          int.parse(parts[0]), int.parse(parts[1]), int.parse(parts[2]));
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return '${days[d.weekday - 1]}, ${months[d.month - 1]} ${d.day.toString().padLeft(2, '0')}';
    } catch (_) {
      return dateStr;
    }
  }

  static String _fmtDateTime(DateTime dt) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    return '${months[dt.month - 1]} ${dt.day}, ${dt.year}  $h:$m';
  }
}
