import 'package:flutter/material.dart';
import '../../models/emr_model.dart';
import '../../services/emr_service.dart';

class EmrViewScreen extends StatefulWidget {
  final String patientToken; 

  const EmrViewScreen({super.key, required this.patientToken});

  @override
  State<EmrViewScreen> createState() => _EmrViewScreenState();
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

          final emrs = snapshot.data!;
          return RefreshIndicator(
            onRefresh: () async { _fetchRecords(); },
            child: ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: emrs.length,
              itemBuilder: (context, index) {
                final emr = emrs[index];
                final dateStr = emr.createdAt?.toLocal().toString().split(' ')[0] ?? "Unknown Date";
                
                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 2,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(dateStr, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            const Icon(Icons.medical_services, color: Colors.blueAccent)
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text('Doctor: ${emr.doctorName}', style: TextStyle(color: Colors.grey[700])),
                        const Divider(height: 24, thickness: 1),
                        
                        _buildSectionHeader('Diagnosis', Colors.blue),
                        Text(emr.diagnosis, style: const TextStyle(fontSize: 15)),
                        const SizedBox(height: 12),
                        
                        _buildSectionHeader('Treatment', Colors.green),
                        Text(emr.treatment, style: const TextStyle(fontSize: 15)),
                        const SizedBox(height: 12),
                        
                        _buildSectionHeader('Notes', Colors.orange),
                        Text(emr.notes, style: const TextStyle(fontSize: 15)),
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildSectionHeader(String title, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Text(
        title.toUpperCase(),
        style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: color, letterSpacing: 1.1),
      ),
    );
  }
}

