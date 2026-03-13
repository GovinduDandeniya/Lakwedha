import 'package:flutter/material.dart';
import '../../models/emr_model.dart';
import '../../services/emr_service.dart';

class EmrViewScreen extends StatefulWidget {
  final String patientToken; 

  const EmrViewScreen({Key? key, required this.patientToken}) : super(key: key);

  @override
  _EmrViewScreenState createState() => _EmrViewScreenState();
}

class _EmrViewScreenState extends State<EmrViewScreen> {
  final EmrService _emrService = EmrService();
  late Future<List<Emr>> _emrsFuture;

  @override
  void initState() {
    super.initState();
    _fetchRecords();
  }

  void _fetchRecords() {
    setState(() {
      _emrsFuture = _emrService.fetchPatientEmrs(widget.patientToken);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
