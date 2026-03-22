import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/booking_provider.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/utils/date_formatter.dart';
import '../../widgets/queue_indicator.dart';

class BookingScreen extends StatefulWidget {
  const BookingScreen({super.key});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  final TextEditingController _symptomsController = TextEditingController();
  final PageController _pageController = PageController();
  int _currentStep = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = Provider.of<BookingProvider>(context, listen: false);
      if (provider.selectedDoctor != null) {
        provider.loadDoctorAvailability(provider.selectedDoctor!.id);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Book Appointment - Step ${_currentStep + 1}'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: Consumer<BookingProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.bookingResult != null) {
            return _buildBookingResult(provider);
          }

          return Column(
            children: [
              // Stepper
              LinearProgressIndicator(
                value: (_currentStep + 1) / 3,
                backgroundColor: Colors.grey[300],
                valueColor: const AlwaysStoppedAnimation<Color>(AppConstants.primaryColor),
              ),
              Expanded(
                child: PageView(
                  controller: _pageController,
                  physics: const NeverScrollableScrollPhysics(),
                  onPageChanged: (index) {
                    setState(() => _currentStep = index);
                  },
                  children: [
                    _buildDoctorInfo(provider),
                    _buildDateTimeSelection(provider),
                    _buildSymptomsInput(provider),
                  ],
                ),
              ),

              // Navigation buttons
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    if (_currentStep > 0)
                      ElevatedButton(
                        onPressed: () {
                          _pageController.previousPage(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.grey,
                          minimumSize: const Size(100, 45),
                        ),
                        child: const Text('Back'),
                      )
                    else
                      const SizedBox(),

                    ElevatedButton(
                      onPressed: _currentStep < 2
                          ? () {
                              _pageController.nextPage(
                                duration: const Duration(milliseconds: 300),
                                curve: Curves.easeInOut,
                              );
                            }
                          : () => _confirmBooking(provider),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppConstants.primaryColor,
                        minimumSize: const Size(100, 45),
                      ),
                      child: Text(_currentStep == 2 ? 'Confirm Booking' : 'Next'),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildDoctorInfo(BookingProvider provider) {
    final doctor = provider.selectedDoctor;
    if (doctor == null) {
      return const Center(child: Text('No doctor selected'));
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 40,
                    backgroundColor: Colors.green[100],
                    backgroundImage: doctor.profileImage != null
                        ? NetworkImage(doctor.profileImage!)
                        : null,
                    child: doctor.profileImage == null
                        ? const Icon(Icons.person, size: 40, color: Colors.green)
                        : null,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          doctor.name,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          doctor.specialization,
                          style: TextStyle(color: Colors.grey[600]),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          doctor.qualification,
                          style: const TextStyle(fontSize: 12),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(Icons.star, color: Colors.amber, size: 16),
                            const SizedBox(width: 4),
                            Text('${doctor.rating} (${doctor.reviewCount} reviews)'),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Clinic Information',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  ListTile(
                    leading: const Icon(Icons.location_on, color: Colors.green),
                    title: Text(doctor.clinicName),
                    subtitle: Text(doctor.clinicAddress),
                  ),
                  ListTile(
                    leading: const Icon(Icons.attach_money, color: Colors.green),
                    title: Text('Consultation Fee: LKR ${doctor.consultationFee}'),
                  ),
                  if (doctor.isVerified)
                    const ListTile(
                      leading: Icon(Icons.verified, color: Colors.blue),
                      title: Text('Government Verified Practitioner'),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDateTimeSelection(BookingProvider provider) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Select Date',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 80,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: 14, // Show next 14 days
              itemBuilder: (context, index) {
                final date = DateTime.now().add(Duration(days: index));
                final isSelected = provider.selectedDate.year == date.year &&
                    provider.selectedDate.month == date.month &&
                    provider.selectedDate.day == date.day;

                return GestureDetector(
                  onTap: () => provider.selectDate(date),
                  child: Container(
                    width: 70,
                    margin: const EdgeInsets.only(right: 8),
                    decoration: BoxDecoration(
                      color: isSelected ? AppConstants.primaryColor : Colors.grey[200],
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected ? AppConstants.primaryColor : Colors.transparent,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          DateFormatter.formatDayOfWeek(date),
                          style: TextStyle(
                            color: isSelected ? Colors.white : Colors.black,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          '${date.day}',
                          style: TextStyle(
                            color: isSelected ? Colors.white : Colors.black,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          DateFormatter.formatShortDate(date),
                          style: TextStyle(
                            color: isSelected ? Colors.white : Colors.grey[600],
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Available Time Slots',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          provider.availableSlotsForSelectedDate.isEmpty
              ? Center(
                  child: Column(
                    children: [
                      const SizedBox(height: 40),
                      Icon(Icons.event_busy, size: 64, color: Colors.grey[400]),
                      const SizedBox(height: 16),
                      Text(
                        'No available slots for this date',
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                    ],
                  ),
                )
              : Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: provider.availableSlotsForSelectedDate.map((slot) {
                    final isSelected = provider.selectedSlot?.id == slot.id;
                    return InkWell(
                      onTap: () => provider.selectSlot(slot),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: isSelected ? AppConstants.primaryColor : Colors.grey[200],
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: isSelected ? AppConstants.primaryColor : Colors.transparent,
                          ),
                        ),
                        child: Text(
                          DateFormatter.formatSlotTime(slot.startTime),
                          style: TextStyle(
                            color: isSelected ? Colors.white : Colors.black,
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
        ],
      ),
    );
  }

  Widget _buildSymptomsInput(BookingProvider provider) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Describe Your Symptoms',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Selected Doctor:',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(provider.selectedDoctor?.name ?? ''),
                  const SizedBox(height: 16),
                  const Text(
                    'Selected Date & Time:',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${DateFormatter.formatDate(provider.selectedDate)} at ${provider.selectedSlot != null ? DateFormatter.formatSlotTime(provider.selectedSlot!.startTime) : ''}',
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _symptomsController,
                    maxLines: 4,
                    decoration: InputDecoration(
                      hintText: 'Please describe your symptoms or reason for visit...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBookingResult(BookingProvider provider) {
    final result = provider.bookingResult!;
    final inQueue = result['inQueue'] ?? false;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              inQueue ? Icons.timer : Icons.check_circle,
              size: 80,
              color: inQueue ? Colors.orange : Colors.green,
            ),
            const SizedBox(height: 24),
            Text(
              inQueue ? 'Added to Queue' : 'Booking Confirmed!',
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            if (inQueue)
              QueueIndicator(
                position: result['queuePosition'] ?? 1,
                totalInQueue: 5, // This should come from API
              ),
            const SizedBox(height: 24),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Text(
                      result['message'] ?? 'Your appointment request has been processed.',
                      textAlign: TextAlign.center,
                    ),
                    if (inQueue) ...[
                      const SizedBox(height: 16),
                      const Text(
                        'We will notify you when a slot becomes available.',
                        style: TextStyle(fontStyle: FontStyle.italic),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () {
                provider.clearBooking();
                Navigator.popUntil(context, (route) => route.isFirst);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppConstants.primaryColor,
                minimumSize: const Size(double.infinity, 50),
              ),
              child: const Text('Back to Home'),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmBooking(BookingProvider provider) async {
    final success = await provider.bookAppointment(_symptomsController.text);

    if (!success && provider.error != null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${provider.error}')),
      );
    }
  }
}