import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:provider/provider.dart';
import 'package:ravana_app/data/datasources/remote/api_service.dart';
import 'package:ravana_app/presentation/providers/auth_provider.dart';
import 'pharmacy_order_status_screen.dart';

const _primary    = Color(0xFF0D5C3E);
const _secondary  = Color(0xFFD4AF37);
const _background = Color(0xFFF8F9FA);

class PharmacyOrderScreen extends StatefulWidget {
  final List<Map<String, dynamic>> selectedPharmacies;
  final Map<String, String> location;

  const PharmacyOrderScreen({
    super.key,
    required this.selectedPharmacies,
    required this.location,
  });

  @override
  State<PharmacyOrderScreen> createState() => _PharmacyOrderScreenState();
}

class _PharmacyOrderScreenState extends State<PharmacyOrderScreen> {
  final _api           = ApiService();
  final _formKey       = GlobalKey<FormState>();
  final _firstNameCtrl = TextEditingController();
  final _lastNameCtrl  = TextEditingController();
  final _addressCtrl   = TextEditingController();
  final _mobileCtrl    = TextEditingController();

  File?   _prescriptionFile;
  String? _prescriptionFileName;
  bool    _isLoading   = false;
  bool    _isUploading = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final user = auth.user ?? {};
      _firstNameCtrl.text = user['firstName']?.toString() ?? '';
      _lastNameCtrl.text  = user['lastName']?.toString()  ?? '';
      _mobileCtrl.text    = user['mobile']?.toString()    ?? '';
    });
  }

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _addressCtrl.dispose();
    _mobileCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    HapticFeedback.selectionClick();
    final picked = await ImagePicker().pickImage(
      source: ImageSource.camera,
      imageQuality: 85,
    );
    if (picked == null) return;
    setState(() {
      _prescriptionFile     = File(picked.path);
      _prescriptionFileName = picked.name;
    });
  }

  Future<void> _pickFile() async {
    HapticFeedback.selectionClick();
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
    );
    if (result == null || result.files.isEmpty) return;
    final path = result.files.single.path;
    if (path == null) return;
    setState(() {
      _prescriptionFile     = File(path);
      _prescriptionFileName = result.files.single.name;
    });
  }

  Future<void> _submitOrder() async {
    if (!_formKey.currentState!.validate()) return;
    if (_prescriptionFile == null) {
      _showSnack('Please upload your prescription first.', isError: true);
      return;
    }

    HapticFeedback.mediumImpact();
    setState(() => _isLoading = true);

    try {
      // 1. Upload prescription file
      setState(() => _isUploading = true);
      final fileUrl = await _api.uploadPrescriptionFile(
        _prescriptionFile!,
        _prescriptionFileName ?? 'prescription.jpg',
      );
      setState(() => _isUploading = false);

      // 2. Submit order with the real patient JWT token
      final pharmacyIds = widget.selectedPharmacies
          .map((p) => (p['_id'] ?? '').toString())
          .where((id) => id.isNotEmpty)
          .toList();

      await _api.submitPharmacyOrder(
        pharmacyIds: pharmacyIds,
        patientDetails: {
          'firstName': _firstNameCtrl.text.trim(),
          'lastName':  _lastNameCtrl.text.trim(),
          'address':   _addressCtrl.text.trim(),
          'mobile':    _mobileCtrl.text.trim(),
        },
        prescriptionFileUrl: fileUrl,
        location: widget.location,
      );

      if (!mounted) return;
      _showSnack('Prescription sent to ${pharmacyIds.length} pharmacy(s)!');
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const PharmacyOrderStatusScreen()),
        (route) => route.isFirst,
      );
    } catch (e) {
      setState(() => _isUploading = false);
      _showSnack(
        e.toString().replaceFirst('Exception: ', ''),
        isError: true,
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showSnack(String msg, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: isError ? Colors.red.shade700 : _primary,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _background,
      appBar: AppBar(
        backgroundColor: _primary,
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text('Order Now',
            style: TextStyle(fontWeight: FontWeight.w900)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 40),
          children: [
            _buildSelectedPharmacies(),
            const SizedBox(height: 24),
            _buildSectionTitle('Patient Details'),
            const SizedBox(height: 12),
            _buildTextField(_firstNameCtrl, 'First Name', Icons.person_outline_rounded),
            const SizedBox(height: 12),
            _buildTextField(_lastNameCtrl, 'Last Name', Icons.person_outline_rounded),
            const SizedBox(height: 12),
            _buildTextField(_addressCtrl, 'Delivery Address', Icons.home_outlined, maxLines: 2),
            const SizedBox(height: 12),
            _buildTextField(_mobileCtrl, 'Mobile Number', Icons.phone_outlined,
                keyboardType: TextInputType.phone),
            const SizedBox(height: 28),
            _buildSectionTitle('Prescription'),
            const SizedBox(height: 12),
            _buildPrescriptionPicker(),
            const SizedBox(height: 32),
            _buildSubmitButton(),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) => Text(
    title,
    style: const TextStyle(
        color: _primary, fontSize: 16, fontWeight: FontWeight.w800),
  );

  Widget _buildSelectedPharmacies() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _primary.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _primary.withValues(alpha: 0.15)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            const Icon(Icons.local_pharmacy_rounded, color: _primary, size: 18),
            const SizedBox(width: 8),
            Text(
              'Sending to ${widget.selectedPharmacies.length} pharmacy(s)',
              style: const TextStyle(
                  color: _primary, fontSize: 14, fontWeight: FontWeight.w700),
            ),
          ]),
          const SizedBox(height: 8),
          ...widget.selectedPharmacies.map((p) {
            final name = p['name'] as String? ?? p['pharmacyName'] as String? ?? 'Pharmacy';
            final city = p['city'] as String? ?? '';
            return Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Row(children: [
                Icon(Icons.check_circle_rounded, color: Colors.amber.shade700, size: 14),
                const SizedBox(width: 6),
                Text(
                  city.isNotEmpty ? '$name, $city' : name,
                  style: TextStyle(color: Colors.grey.shade700, fontSize: 13),
                ),
              ]),
            );
          }),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms);
  }

  Widget _buildTextField(
    TextEditingController ctrl,
    String label,
    IconData icon, {
    int maxLines = 1,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return TextFormField(
      controller: ctrl,
      maxLines: maxLines,
      keyboardType: keyboardType,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: _primary, size: 20),
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: _primary, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      validator: (v) =>
          (v == null || v.trim().isEmpty) ? 'Please enter $label' : null,
    );
  }

  Widget _buildPrescriptionPicker() {
    return Column(
      children: [
        if (_prescriptionFile != null) ...[
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.green.shade50,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.green.shade200),
            ),
            child: Row(children: [
              Icon(Icons.description_rounded,
                  color: Colors.green.shade700, size: 28),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _prescriptionFileName ?? 'prescription',
                      style: TextStyle(
                          color: Colors.green.shade800,
                          fontWeight: FontWeight.w700),
                      overflow: TextOverflow.ellipsis,
                    ),
                    const Text('Ready to upload',
                        style: TextStyle(color: Colors.green, fontSize: 12)),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close_rounded, color: Colors.red),
                onPressed: () => setState(() {
                  _prescriptionFile     = null;
                  _prescriptionFileName = null;
                }),
              ),
            ]),
          ),
          const SizedBox(height: 12),
        ] else
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: _primary.withValues(alpha: 0.25),
                width: 1.5,
              ),
            ),
            child: Column(children: [
              Icon(Icons.upload_file_rounded,
                  color: _primary.withValues(alpha: 0.5), size: 48),
              const SizedBox(height: 12),
              const Text('Upload Prescription',
                  style: TextStyle(
                      color: _primary,
                      fontSize: 15,
                      fontWeight: FontWeight.w700)),
              const SizedBox(height: 4),
              Text('JPG, PNG or PDF accepted',
                  style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
            ]),
          ),
        const SizedBox(height: 12),
        Row(children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: _pickImage,
              icon: const Icon(Icons.camera_alt_rounded),
              label: const Text('Camera'),
              style: OutlinedButton.styleFrom(
                foregroundColor: _primary,
                side: const BorderSide(color: _primary),
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: OutlinedButton.icon(
              onPressed: _pickFile,
              icon: const Icon(Icons.folder_open_rounded),
              label: const Text('Browse'),
              style: OutlinedButton.styleFrom(
                foregroundColor: _primary,
                side: const BorderSide(color: _primary),
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ]),
      ],
    );
  }

  Widget _buildSubmitButton() {
    final busy = _isLoading || _isUploading;
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton.icon(
        onPressed: busy ? null : _submitOrder,
        icon: busy
            ? const SizedBox(
                width: 20, height: 20,
                child: CircularProgressIndicator(
                    color: Colors.white, strokeWidth: 2.5))
            : const Icon(Icons.send_rounded),
        label: Text(
          _isUploading
              ? 'Uploading prescription…'
              : _isLoading
                  ? 'Submitting…'
                  : 'Submit Prescription',
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: _secondary,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14)),
        ),
      ),
    ).animate().fadeIn(duration: 600.ms, delay: 200.ms);
  }
}
