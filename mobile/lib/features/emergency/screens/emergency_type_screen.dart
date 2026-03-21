import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import 'emergency_map_screen.dart';

class EmergencyTypeScreen extends StatelessWidget {
  const EmergencyTypeScreen({super.key});

  static const List<String> _criticalTypes = [
    'Snake Bite',
    'Fractures (Hand / Leg Broken)',
    'Poisoning (Herbal First Aid)',
    'Head Injury (Mild)',
    'Paralysis (Initial Care)',
  ];

  static const List<Map<String, dynamic>> _emergencyTypes = [
    {'label': 'Snake Bite',                        'icon': Icons.pest_control},
    {'label': 'Fractures (Hand / Leg Broken)',     'icon': Icons.accessibility_new},
    {'label': 'Joint Dislocation',                 'icon': Icons.sports_martial_arts},
    {'label': 'Burn Injuries',                     'icon': Icons.local_fire_department},
    {'label': 'Wounds & Cuts',                     'icon': Icons.healing},
    {'label': 'Poisoning (Herbal First Aid)',       'icon': Icons.warning_amber},
    {'label': 'Fever & Infection',                 'icon': Icons.thermostat},
    {'label': 'Allergic Reactions',                'icon': Icons.coronavirus},
    {'label': 'Insect Bites & Stings',             'icon': Icons.bug_report},
    {'label': 'Muscle Sprain / Ligament Injury',   'icon': Icons.fitness_center},
    {'label': 'Paralysis (Initial Care)',           'icon': Icons.airline_seat_flat},
    {'label': 'Head Injury (Mild)',                 'icon': Icons.psychology},
    {'label': 'Skin Diseases (Severe)',             'icon': Icons.face_retouching_natural},
    {'label': 'Digestive Emergencies',             'icon': Icons.restaurant},
    {'label': 'Respiratory Distress (Asthma)',     'icon': Icons.air},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Select Emergency Type',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: Colors.white,
            letterSpacing: 0.3,
          ),
        ),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF870000), Color(0xFFBF360C)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
        elevation: 2,
      ),
      backgroundColor: const Color(0xFFF0F4F8),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            margin: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: Colors.red.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.red.shade200),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline, color: Colors.red.shade700, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Select the emergency type to find nearby Ayurveda centers that can help.',
                    style: TextStyle(
                      color: Colors.red.shade900,
                      fontSize: 13,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
              itemCount: _emergencyTypes.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final item = _emergencyTypes[index];
                final label = item['label'] as String;
                final icon = item['icon'] as IconData;
                final isCritical = _criticalTypes.contains(label);
                return _EmergencyTypeCard(
                  label: label,
                  icon: icon,
                  isCritical: isCritical,
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => EmergencyMapScreen(initialEmergencyType: label),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _EmergencyTypeCard extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isCritical;
  final VoidCallback onTap;

  const _EmergencyTypeCard({
    required this.label,
    required this.icon,
    required this.isCritical,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final Color accentColor =
        isCritical ? const Color(0xFFBF360C) : AppColors.primary;
    final Color bgColor = isCritical ? Colors.red.shade50 : Colors.white;
    final Color borderColor =
        isCritical ? Colors.red.shade200 : const Color(0xFFE8EDF2);
    final Color iconBg = isCritical
        ? Colors.red.shade100
        : AppColors.accentLight.withValues(alpha: 0.12);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: borderColor),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: iconBg,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: accentColor, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 14.5,
                      fontWeight: FontWeight.w600,
                      color: isCritical
                          ? Colors.red.shade900
                          : AppColors.textDark,
                    ),
                  ),
                  if (isCritical)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(
                        'CRITICAL — Seek immediate care',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: Colors.red.shade600,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            Icon(
              Icons.chevron_right_rounded,
              color: isCritical ? Colors.red.shade400 : Colors.grey.shade400,
              size: 22,
            ),
          ],
        ),
      ),
    );
  }
}
