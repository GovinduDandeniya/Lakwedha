import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../services/emr_service.dart';

/// Doctor-side screen for uploading medical records to EMR.
/// Supports three input methods: Camera capture, File picker, and Text input.
class EmrUploadScreen extends StatefulWidget {
  final String doctorToken;
  final String patientId;
  final String patientName;
  final String? appointmentId;

  const EmrUploadScreen({
    super.key,
    required this.doctorToken,
    required this.patientId,
    required this.patientName,
    this.appointmentId,
  });

  @override
  State<EmrUploadScreen> createState() => _EmrUploadScreenState();
}

class _EmrUploadScreenState extends State<EmrUploadScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  final EmrService _emrService = EmrService();
  final ImagePicker _picker = ImagePicker();

  // Shared fields
  final _titleCtrl     = TextEditingController();
  String _recordType   = 'file';
  bool   _isLoading    = false;

  // Camera / file tab
  File? _pickedFile;
  String? _pickedFileName;

  // Text tab
  final _diagnosisCtrl = TextEditingController();
  final _notesCtrl     = TextEditingController();

  static const _recordTypes = [
    ('file',          'Lab Report'),
    ('prescription',  'Prescription'),
    ('medical_record','Medical Record'),
    ('text',          'Diagnosis Note'),
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _titleCtrl.dispose();
    _diagnosisCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _captureFromCamera() async {
    final XFile? image = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 85,
    );
    if (image == null) return;
    setState(() {
      _pickedFile     = File(image.path);
      _pickedFileName = image.name;
    });
  }

  Future<void> _pickFromGallery() async {
    final XFile? image = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
    );
    if (image == null) return;
    setState(() {
      _pickedFile     = File(image.path);
      _pickedFileName = image.name;
    });
  }

  Future<void> _submit() async {
    final tabIdx = _tabController.index;
    final hasFile = _pickedFile != null;
    final hasText = _diagnosisCtrl.text.trim().isNotEmpty ||
                    _notesCtrl.text.trim().isNotEmpty;

    if (tabIdx < 2 && !hasFile) {
      _showSnack('Please capture or select a file first.', Colors.orange);
      return;
    }
    if (tabIdx == 2 && !hasText) {
      _showSnack('Please enter diagnosis or notes text.', Colors.orange);
      return;
    }

    setState(() => _isLoading = true);
    try {
      await _emrService.uploadEMRRecord(
        patientId:     widget.patientId,
        type:          tabIdx == 0 ? 'camera' : tabIdx == 1 ? _recordType : 'text',
        title:         _titleCtrl.text.trim().isNotEmpty
                           ? _titleCtrl.text.trim()
                           : _recordType,
        diagnosis:     _diagnosisCtrl.text.trim(),
        notes:         _notesCtrl.text.trim(),
        appointmentId: widget.appointmentId,
        file:          (tabIdx < 2) ? _pickedFile : null,
        token:         widget.doctorToken,
      );

      if (!mounted) return;
      _showSnack('Record uploaded and encrypted successfully.', Colors.green);
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      _showSnack('Upload failed: ${e.toString().replaceFirst('Exception: ', '')}', Colors.red);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showSnack(String msg, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: color),
    );
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Upload Medical Record'),
        backgroundColor: const Color(0xFF2E7D32),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF2E7D32)))
          : Column(
              children: [
                _buildPatientBanner(),
                _buildMetaFields(),
                _buildTabBar(),
                Expanded(child: _buildTabViews()),
                _buildSubmitButton(),
              ],
            ),
    );
  }

  Widget _buildPatientBanner() {
    return Container(
      color: const Color(0xFF2E7D32),
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
      child: Row(
        children: [
          const CircleAvatar(
            radius: 18,
            backgroundColor: Colors.white24,
            child: Icon(Icons.person, color: Colors.white, size: 20),
          ),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(widget.patientName,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
              const Text('Medical Record Upload',
                  style: TextStyle(color: Colors.white70, fontSize: 12)),
            ],
          ),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white24,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Row(
              children: [
                Icon(Icons.lock, color: Colors.white, size: 12),
                SizedBox(width: 4),
                Text('AES-256', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetaFields() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _titleCtrl,
              decoration: InputDecoration(
                labelText: 'Record Title',
                hintText: 'e.g. Blood Test',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
            ),
          ),
          const SizedBox(width: 12),
          DropdownButtonFormField<String>(
            initialValue: _recordType,
            decoration: InputDecoration(
              labelText: 'Type',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            ),
            items: _recordTypes
                .map((t) => DropdownMenuItem(value: t.$1, child: Text(t.$2, style: const TextStyle(fontSize: 13))))
                .toList(),
            onChanged: (v) => setState(() => _recordType = v ?? 'file'),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: TabBar(
        controller: _tabController,
        indicator: BoxDecoration(
          color: const Color(0xFF2E7D32),
          borderRadius: BorderRadius.circular(8),
        ),
        labelColor: Colors.white,
        unselectedLabelColor: Colors.grey[600],
        labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
        tabs: const [
          Tab(icon: Icon(Icons.camera_alt, size: 18), text: 'Camera'),
          Tab(icon: Icon(Icons.upload_file, size: 18), text: 'File'),
          Tab(icon: Icon(Icons.text_fields, size: 18), text: 'Text'),
        ],
      ),
    );
  }

  Widget _buildTabViews() {
    return TabBarView(
      controller: _tabController,
      children: [
        _buildCameraTab(),
        _buildFileTab(),
        _buildTextTab(),
      ],
    );
  }

  // ── Camera Tab ─────────────────────────────────────────────────────────────

  Widget _buildCameraTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          if (_pickedFile != null && _tabController.index == 0) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.file(_pickedFile!, height: 220, width: double.infinity, fit: BoxFit.cover),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.green, size: 18),
                const SizedBox(width: 6),
                Expanded(child: Text(_pickedFileName ?? '', style: const TextStyle(fontWeight: FontWeight.w600))),
              ],
            ),
            const SizedBox(height: 12),
          ] else
            Container(
              height: 180,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.grey[200],
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.camera_alt, size: 48, color: Colors.grey),
                  SizedBox(height: 8),
                  Text('No image captured', style: TextStyle(color: Colors.grey)),
                ],
              ),
            ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _captureFromCamera,
              icon: const Icon(Icons.camera_alt),
              label: Text(_pickedFile != null ? 'Retake Photo' : 'Open Camera'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1565C0),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── File Tab ───────────────────────────────────────────────────────────────

  Widget _buildFileTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          GestureDetector(
            onTap: _pickFromGallery,
            child: Container(
              height: 160,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade300, width: 2, style: BorderStyle.solid),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.folder_open, size: 48, color: Colors.orange[700]),
                  const SizedBox(height: 8),
                  const Text('Tap to browse gallery', style: TextStyle(fontWeight: FontWeight.w600)),
                  const Text('JPG, PNG, PDF supported', style: TextStyle(color: Colors.grey, fontSize: 12)),
                ],
              ),
            ),
          ),
          if (_pickedFile != null && _tabController.index == 1) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.green[50],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.green.shade200),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle, color: Colors.green, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(_pickedFileName ?? '', style: const TextStyle(fontWeight: FontWeight.bold), overflow: TextOverflow.ellipsis),
                        Text('${(_pickedFile!.lengthSync() / 1024).toStringAsFixed(1)} KB',
                            style: const TextStyle(color: Colors.grey, fontSize: 12)),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.red, size: 20),
                    onPressed: () => setState(() { _pickedFile = null; _pickedFileName = null; }),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: _pickFromGallery,
              icon: const Icon(Icons.photo_library),
              label: const Text('Browse Gallery'),
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF1565C0),
                side: const BorderSide(color: Color(0xFF1565C0)),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Text Tab ───────────────────────────────────────────────────────────────

  Widget _buildTextTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          TextField(
            controller: _diagnosisCtrl,
            maxLines: 3,
            decoration: InputDecoration(
              labelText: 'Diagnosis',
              hintText: 'Enter diagnosis details...',
              alignLabelWithHint: true,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _notesCtrl,
            maxLines: 5,
            decoration: InputDecoration(
              labelText: 'Notes / Prescription',
              hintText: 'Enter medical notes, prescriptions, or treatment plan...',
              alignLabelWithHint: true,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            ),
          ),
        ],
      ),
    );
  }

  // ── Submit button ──────────────────────────────────────────────────────────

  Widget _buildSubmitButton() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      color: Colors.white,
      child: SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          onPressed: _isLoading ? null : _submit,
          icon: const Icon(Icons.cloud_upload),
          label: const Text('Upload Record', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFFE65100),
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        ),
      ),
    );
  }
}
