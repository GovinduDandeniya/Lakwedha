import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import '../../services/prescription_service.dart';

class CreatePrescriptionScreen extends StatefulWidget {
  final String doctorToken;

  const CreatePrescriptionScreen({Key? key, required this.doctorToken}) : super(key: key);

  @override
  _CreatePrescriptionScreenState createState() => _CreatePrescriptionScreenState();
}

class _CreatePrescriptionScreenState extends State<CreatePrescriptionScreen> {
  final _formKey = GlobalKey<FormState>();
  final PrescriptionService _service = PrescriptionService();
  
  final TextEditingController _patientIdController = TextEditingController();
  final TextEditingController _notesController = TextEditingController();
  
  final List<Map<String, TextEditingController>> _medicationControllers = [];
  File? _selectedFile;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _addMedicationField(); // Start with at least one field natively
  }

  void _addMedicationField() {
    setState(() {
      _medicationControllers.add({
        'name': TextEditingController(),
        'dosage': TextEditingController(),
        'duration': TextEditingController(),
      });
    });
  }

  void _removeMedicationField(int index) {
    if (_medicationControllers.length > 1) {
      setState(() {
        _medicationControllers[index]['name']?.dispose();
        _medicationControllers[index]['dosage']?.dispose();
        _medicationControllers[index]['duration']?.dispose();
        _medicationControllers.removeAt(index);
      });
    }
  }

  Future<void> _pickFile() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
    );

    if (result != null) {
      setState(() {
        _selectedFile = File(result.files.single.path!);
      });
    }
  }

  Future<void> _submitPrescription() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isLoading = true);

    try {
      List<Map<String, dynamic>> structuredMeds = _medicationControllers.map((m) => {
        'name': m['name']!.text,
        'dosage': m['dosage']!.text,
        'duration': m['duration']!.text,
      }).toList();

      await _service.createPrescription(
        patientId: _patientIdController.text.trim(),
        medications: structuredMeds,
        notes: _notesController.text.trim(),
        attachedFile: _selectedFile,
        token: widget.doctorToken,
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Prescription Generated & Uploaded!'), backgroundColor: Colors.green),
      );
      
      Navigator.pop(context); // Go back after success natively

    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Submission Failed: ${e.toString()}'), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Issue New Prescription'), backgroundColor: Colors.teal),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : Form(
          key: _formKey,
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildSectionTitle('Patient Details'),
                TextFormField(
                  controller: _patientIdController,
                  decoration: const InputDecoration(
                    labelText: 'Patient MongoDB ID / Name', 
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.person)
                  ),
                  validator: (val) => val == null || val.trim().isEmpty ? 'Required' : null,
                ),
                const SizedBox(height: 24),
                
                _buildSectionTitle('Medications Mapping'),
                ..._medicationControllers.asMap().entries.map((entry) {
                  int idx = entry.key;
