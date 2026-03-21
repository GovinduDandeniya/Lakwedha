import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ravana_app/src/core/api_client.dart';
import 'package:ravana_app/src/theme/app_theme.dart';

class UploadPrescriptionScreen extends ConsumerStatefulWidget {
  const UploadPrescriptionScreen({super.key});

  @override
  ConsumerState<UploadPrescriptionScreen> createState() =>
      _UploadPrescriptionScreenState();
}

class _UploadPrescriptionScreenState
    extends ConsumerState<UploadPrescriptionScreen> {
  bool _isLoading = false;
  bool _isSuccess = false;
  String? _selectedPharmacyId;
  List<dynamic> _pharmacies = [];

  @override
  void initState() {
    super.initState();
    _fetchPharmacies();
  }

  Future<void> _fetchPharmacies() async {
    try {
      final dio = ref.read(dioProvider);
      final response = await dio.get('/users/pharmacies');
      if (response.data != null && response.data['data'] != null) {
        setState(() {
          _pharmacies = response.data['data'];
        });
      }
    } catch (e) {
      debugPrint("Failed to fetch pharmacies: $e");
    }
  }

  Future<void> _submitPrescription() async {
    if (_selectedPharmacyId == null || _selectedPharmacyId!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a pharmacy first!'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final dio = ref.read(dioProvider);
      
      // Simulate file upload with dummy URL
      const dummyImageUrl =
          "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=2030&auto=format&fit=crop";

      final response = await dio.post('/pharmacy/prescriptions', data: {
        'imageUrl': dummyImageUrl,
        'patientName': "Guest Patient",
        'pharmacyId': _selectedPharmacyId,
      });

      if (response.statusCode == 201 || response.statusCode == 200) {
        setState(() {
          _isSuccess = true;
        });

        // Delay and return to prior screen
        Future.delayed(const Duration(seconds: 3), () {
          if (mounted) {
             Navigator.pop(context);
          }
        });
      }
    } on DioException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                e.response?.data['message'] ?? 'Failed to submit prescription.'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('An unexpected error occurred.'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isSuccess) {
      return Scaffold(
        backgroundColor: AppTheme.backgroundColor,
        body: Center(
          child: Container(
            padding: const EdgeInsets.all(32),
            margin: const EdgeInsets.symmetric(horizontal: 24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(40),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.check_circle_outline,
                  color: AppTheme.primaryColor,
                  size: 80,
                ),
                const SizedBox(height: 24),
                const Text(
                  'Submission Successful!',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    color: AppTheme.secondaryColor,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Your prescription has been sent. We will notify you when it is priced.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 16,
                    color: AppTheme.secondaryColor.withValues(alpha: 0.6),
                  ),
                ),
                const SizedBox(height: 24),
                Container(
                  width: double.infinity,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded,
              color: AppTheme.secondaryColor),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Upload Prescription',
          style: TextStyle(
            color: AppTheme.secondaryColor,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Order Your Medicines',
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.w900,
                color: AppTheme.secondaryColor,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Upload a clear photo of your prescription. Our certified Ayurvedic pharmacists will review it and send you a price quote.',
              style: TextStyle(
                fontSize: 16,
                color: AppTheme.secondaryColor.withValues(alpha: 0.6),
                height: 1.5,
              ),
            ),
            const SizedBox(height: 32),
            
            // Dummy Upload Area
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 40),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(32),
                border: Border.all(
                  color: AppTheme.secondaryColor.withValues(alpha: 0.1),
                  width: 2,
                ),
              ),
              child: Column(
                children: [
                   Container(
                     padding: const EdgeInsets.all(16),
                     decoration: BoxDecoration(
                       color: AppTheme.primaryColor.withValues(alpha: 0.1),
                       shape: BoxShape.circle,
                     ),
                     child: const Icon(
                       Icons.upload_file_rounded,
                       color: AppTheme.primaryColor,
                       size: 40,
                     ),
                   ),
                   const SizedBox(height: 16),
                   const Text(
                     'Tap to simulate upload',
                     style: TextStyle(
                       fontSize: 18,
                       fontWeight: FontWeight.bold,
                       color: AppTheme.secondaryColor,
                     ),
                   ),
                ],
              ),
            ),
            
            const SizedBox(height: 32),

            // Pharmacy Selection Dropdown
            const Text(
              'Select a Pharmacy',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: AppTheme.secondaryColor,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: AppTheme.secondaryColor.withValues(alpha: 0.1),
                ),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  isExpanded: true,
                  hint: const Text('Choose a pharmacy near you...'),
                  value: _selectedPharmacyId,
                  icon: const Icon(Icons.keyboard_arrow_down_rounded),
                  items: _pharmacies.map<DropdownMenuItem<String>>((p) {
                    return DropdownMenuItem<String>(
                      value: p['_id'],
                      child: Text(
                        p['name'],
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                    );
                  }).toList(),
                  onChanged: (val) {
                    setState(() {
                      _selectedPharmacyId = val;
                    });
                  },
                ),
              ),
            ),

            const SizedBox(height: 48),

            // Submit Button
            SizedBox(
              width: double.infinity,
              height: 60,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _submitPrescription,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.secondaryColor,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text(
                        'Submit Prescription',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
