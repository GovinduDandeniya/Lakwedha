import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import '../../services/prescription_service.dart';

class CreatePrescriptionScreen extends StatefulWidget {
  final String doctorToken;

  const CreatePrescriptionScreen({super.key, required this.doctorToken});

  @override
  State<CreatePrescriptionScreen> createState() => _CreatePrescriptionScreenState();
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
                  var ctrls = entry.value;
                  return Card(
                    elevation: 2,
                    margin: const EdgeInsets.symmetric(vertical: 8),
                    child: Padding(
                      padding: const EdgeInsets.all(12.0),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Drug #${idx + 1}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                              if (_medicationControllers.length > 1) 
                                IconButton(icon: const Icon(Icons.cancel, color: Colors.red), onPressed: () => _removeMedicationField(idx)),
                            ],
                          ),
                          TextFormField(
                            controller: ctrls['name'],
                            decoration: const InputDecoration(labelText: 'Medication Name'),
                            validator: (val) => val!.trim().isEmpty ? 'Required' : null,
                          ),
                          Row(
                            children: [
                              Expanded(
                                child: TextFormField(
                                  controller: ctrls['dosage'],
                                  decoration: const InputDecoration(labelText: 'Dosage (e.g. 20mg)'),
                                  validator: (val) => val!.trim().isEmpty ? 'Required' : null,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: TextFormField(
                                  controller: ctrls['duration'],
                                  decoration: const InputDecoration(labelText: 'Duration (e.g. 5 days)'),
                                  validator: (val) => val!.trim().isEmpty ? 'Required' : null,
                                ),
                              ),
                            ],
                          )
                        ],
                      ),
                    ),
                  );
                }),
                
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  onPressed: _addMedicationField,
                  icon: const Icon(Icons.add_circle, color: Colors.teal),
                  label: const Text('Add Another Medication', style: TextStyle(color: Colors.teal)),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Colors.teal),
                    padding: const EdgeInsets.symmetric(vertical: 12)
                  ),
                ),
                
                const SizedBox(height: 24),
                _buildSectionTitle('Supplementary Notes'),
                TextFormField(
                  controller: _notesController,
                  decoration: const InputDecoration(
                    labelText: 'Treatment rules, warnings, etc.', 
                    border: OutlineInputBorder(),
                    alignLabelWithHint: true
                  ),
                  maxLines: 3,
                ),
                
                const SizedBox(height: 24),
                _buildSectionTitle('Document Upload'),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    border: Border.all(color: Colors.grey[300]!),
                    borderRadius: BorderRadius.circular(8)
                  ),
                  child: Row(
                    children: [
                      ElevatedButton.icon(
                        onPressed: _pickFile,
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.blueGrey),
                        icon: const Icon(Icons.upload_file),
                        label: const Text('Select File'),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _selectedFile != null ? _selectedFile!.path.split(Platform.pathSeparator).last : 'PDF/JPG/PNG only', 
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(color: _selectedFile != null ? Colors.black : Colors.grey, fontStyle: FontStyle.italic)
                        )
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 32),
                ElevatedButton(
                  onPressed: _submitPrescription,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.teal,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))
                  ),
                  child: const Text('SUBMIT PRESCRIPTION', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.teal, letterSpacing: 1.1),
      ),
    );
  }
}

