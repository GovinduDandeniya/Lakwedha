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

