import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_constants.dart';
import '../../providers/booking_provider.dart';

class BookingScreen extends StatefulWidget {
  const BookingScreen({super.key});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  final TextEditingController _symptomsController = TextEditingController();

  @override
  void initState() {
    super.initState();
    final provider = Provider.of<BookingProvider>(context, listen: false);
    if (provider.selectedDoctor != null) {
      provider.loadDoctorAvailability(provider.selectedDoctor!.id);
    }
  }

  @override
  void dispose() {
    _symptomsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<BookingProvider>(context);
    final doctor = provider.selectedDoctor;

    if (doctor == null) {
      return const Scaffold(
        body: Center(child: Text('No doctor selected')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('Book with ${doctor.name}'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: provider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Doctor info
                  Card(
                    child: ListTile(
                      leading: const Icon(Icons.person,
                          color: AppConstants.primaryColor),
                      title: Text(doctor.name,
                          style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text(doctor.specialization),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Date picker
                  const Text('Select Date',
                      style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  SizedBox(
                    height: 60,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: 14,
                      itemBuilder: (context, index) {
                        final date =
                            DateTime.now().add(Duration(days: index));
                        final isSelected = provider.selectedDate.day ==
                                date.day &&
                            provider.selectedDate.month == date.month;
                        return GestureDetector(
                          onTap: () => provider.selectDate(date),
                          child: Container(
                            width: 50,
                            margin: const EdgeInsets.only(right: 8),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? AppConstants.primaryColor
                                  : Colors.grey[200],
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat',
                                      'Sun'][date.weekday - 1],
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: isSelected
                                        ? Colors.white
                                        : Colors.grey[600],
                                  ),
                                ),
                                Text(
                                  '${date.day}',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: isSelected
                                        ? Colors.white
                                        : Colors.black,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Time slots
                  const Text('Available Slots',
                      style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  provider.availableSlotsForSelectedDate.isEmpty
                      ? const Text('No slots available for this date',
                          style: TextStyle(color: Colors.grey))
                      : Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children:
                              provider.availableSlotsForSelectedDate.map((slot) {
                            final isSelected =
                                provider.selectedSlot?.id == slot.id;
                            return ChoiceChip(
                              label: Text(slot.startTime),
                              selected: isSelected,
                              onSelected: (_) => provider.selectSlot(slot),
                              selectedColor: AppConstants.primaryColor,
                              labelStyle: TextStyle(
                                color: isSelected ? Colors.white : Colors.black,
                              ),
                            );
                          }).toList(),
                        ),
                  const SizedBox(height: 16),

                  // Symptoms
                  const Text('Symptoms (optional)',
                      style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _symptomsController,
                    maxLines: 3,
                    decoration: InputDecoration(
                      hintText: 'Describe your symptoms...',
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Book button
                  if (provider.error != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Text(provider.error!,
                          style: const TextStyle(color: Colors.red)),
                    ),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: provider.selectedSlot == null
                          ? null
                          : () async {
                              final success = await provider
                                  .bookAppointment(_symptomsController.text);
                              if (success && context.mounted) {
                                Navigator.pop(context);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                      content:
                                          Text('Appointment booked successfully')),
                                );
                              }
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppConstants.primaryColor,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8)),
                      ),
                      child: const Text('Book Appointment',
                          style: TextStyle(fontSize: 16)),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
