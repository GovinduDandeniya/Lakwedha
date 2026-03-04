import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/booking_provider.dart';
import '../../../core/constants/app_constants.dart';
import '../../../data/datasources/remote/api_service.dart';
import '../../../data/models/doctor_model.dart';
import '../../widgets/doctor_card.dart';
import 'booking_screen.dart';

class DoctorSearchScreen extends StatefulWidget {
  const DoctorSearchScreen({Key? key}) : super(key: key);

  @override
  State<DoctorSearchScreen> createState() => _DoctorSearchScreenState();
}

class _DoctorSearchScreenState extends State<DoctorSearchScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _searchController = TextEditingController();

  List<Doctor> _doctors = [];
  bool _isLoading = false;
  String? _selectedSpecialty;

  final List<String> _specialties = [
    'All',
    'Kadum Bidum',
    'Sarpa Visha',
    'General',
    'Panchakarma',
    'Skin Diseases',
  ];

  @override
  void initState() {
    super.initState();
    _loadDoctors();
  }

  Future<void> _loadDoctors() async {
    setState(() => _isLoading = true);

    try {
      _doctors = await _apiService.searchDoctors();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _searchDoctors() async {
    setState(() => _isLoading = true);
    try {
      _doctors = await _apiService.searchDoctors(
        specialty: _selectedSpecialty == 'All' ? null : _selectedSpecialty,
        location: _searchController.text.isNotEmpty ? _searchController.text : null,
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bookingProvider = Provider.of<BookingProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Find Ayurveda Doctors'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search by doctor name or location...',
                    prefixIcon: const Icon(Icons.search),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    filled: true,
                    fillColor: Colors.grey[100],
                  ),
                  onSubmitted: (_) => _searchDoctors(),
                ),
                const SizedBox(height: 12),
                // Specialty Filter Chips
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _specialties.map((specialty) {
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: FilterChip(
                          label: Text(specialty),
                          selected: _selectedSpecialty == specialty,
                          onSelected: (selected) {
                            setState(() {
                              _selectedSpecialty = selected ? specialty : null;
                            });
                            _searchDoctors();
                          },
                          backgroundColor: Colors.grey[200],
                          selectedColor: AppConstants.primaryColor,
                          labelStyle: TextStyle(
                            color: _selectedSpecialty == specialty
                                ? Colors.white
                                : Colors.black,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),

          // Results
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _doctors.isEmpty
                    ? const Center(
                        child: Text('No doctors found'),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: _doctors.length,
                        itemBuilder: (context, index) {
                          final doctor = _doctors[index];
                          return DoctorCard(
                            doctor: doctor,
                            onTap: () {
                              bookingProvider.selectDoctor(doctor);
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => const BookingScreen(),
                                ),
                              );
                            },
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}