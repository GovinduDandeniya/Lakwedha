import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/constants/app_colors.dart';
import '../models/emergency_center.dart';

/// Bottom sheet widget displaying details of a selected emergency center.
/// Extracted from EmergencyMapScreen for better code organization.
class CenterDetailsSheet extends StatelessWidget {
  final EmergencyCenter center;
  final String? formattedDistance;

  const CenterDetailsSheet({
    super.key,
    required this.center,
    this.formattedDistance,
  });

  Future<void> _makePhoneCall(String phoneNumber) async {
    final uri = Uri(scheme: 'tel', path: phoneNumber);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> _openDirections(double lat, double lng) async {
    final uri = Uri.parse(
      'https://www.google.com/maps/dir/?api=1&destination=$lat,$lng',
    );
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Name
          Text(
            center.name,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1A1A1A),
            ),
          ),
          const SizedBox(height: 8),
          // Type badge + 24h indicator
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: AppColors.accentLight.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  center.typeLabel,
                  style: TextStyle(
                    color: AppColors.accentLight,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              if (center.is24Hours) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.accent.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '24 Hours',
                    style: TextStyle(
                      color: AppColors.accent,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 12),
          // Distance from user
          if (formattedDistance != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  Icon(Icons.near_me_outlined, size: 20, color: AppColors.accent),
                  const SizedBox(width: 8),
                  Text(
                    formattedDistance!,
                    style: TextStyle(
                      color: AppColors.accent,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          // Address
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.location_on_outlined, size: 20, color: AppColors.textMedium),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  center.address,
                  style: TextStyle(
                    color: AppColors.textMedium,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
          Divider(color: Colors.grey.shade200, height: 24),
          // Phone
          Row(
            children: [
              Icon(Icons.phone_outlined, size: 20, color: AppColors.textMedium),
              const SizedBox(width: 8),
              Text(
                center.phone,
                style: TextStyle(
                  color: AppColors.textMedium,
                  fontSize: 14,
                ),
              ),
            ],
          ),
          Divider(color: Colors.grey.shade200, height: 28),
          // Call button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => _makePhoneCall(center.phone),
              icon: const Icon(Icons.phone, size: 20),
              label: const Text(
                'Call Now',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.accentLight,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                elevation: 2,
                shadowColor: AppColors.accentLight.withValues(alpha: 0.4),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),
          // Directions button
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => _openDirections(center.latitude, center.longitude),
              icon: const Icon(Icons.directions, size: 20),
              label: const Text(
                'Get Directions',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primary,
                side: BorderSide(color: AppColors.primary, width: 1.5),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
        ],
      ),
    );
  }
}
