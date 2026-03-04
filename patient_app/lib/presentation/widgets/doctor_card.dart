import 'package:flutter/material.dart';
import '../../data/models/doctor_model.dart';
import '../../core/constants/app_constants.dart';

class DoctorCard extends StatelessWidget {
  final Doctor doctor;
  final VoidCallback onTap;

  const DoctorCard({super.key, required this.doctor, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              CircleAvatar(
                radius: 30,
                backgroundColor: AppConstants.primaryColor.withValues(alpha: 0.1),
                backgroundImage: doctor.profileImage != null
                    ? NetworkImage(doctor.profileImage!)
                    : null,
                child: doctor.profileImage == null
                    ? const Icon(Icons.person, color: AppConstants.primaryColor)
                    : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            doctor.name,
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                        ),
                        if (doctor.isVerified)
                          const Icon(Icons.verified,
                              color: AppConstants.primaryColor, size: 18),
                      ],
                    ),
                    Text(doctor.specialization,
                        style: TextStyle(color: Colors.grey[600])),
                    Text(doctor.clinicName,
                        style: TextStyle(color: Colors.grey[500], fontSize: 12)),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.star, color: Colors.amber, size: 16),
                        Text(' ${doctor.rating.toStringAsFixed(1)}',
                            style: const TextStyle(fontSize: 12)),
                        const SizedBox(width: 8),
                        Text('Rs. ${doctor.consultationFee.toStringAsFixed(0)}',
                            style: const TextStyle(
                                fontSize: 12,
                                color: AppConstants.primaryColor,
                                fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }
}
