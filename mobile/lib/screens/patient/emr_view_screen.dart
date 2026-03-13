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
      appBar: AppBar(
        title: const Text('My EMR Timeline'),
        centerTitle: true,
        backgroundColor: Colors.blueAccent,
      ),
      body: FutureBuilder<List<Emr>>(
        future: _emrsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } 
          
          if (snapshot.hasError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, color: Colors.red, size: 60),
                  const SizedBox(height: 10),
                  Text('Failed to load records:\n${snapshot.error}', textAlign: TextAlign.center),
                  const SizedBox(height: 10),
                  ElevatedButton(onPressed: _fetchRecords, child: const Text('Retry'))
                ],
              ),
            );
          } 
          
          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(
              child: Text('No EMR records available.', style: TextStyle(fontSize: 16, color: Colors.grey)),
            );
          }

