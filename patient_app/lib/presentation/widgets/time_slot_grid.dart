import 'package:flutter/material.dart';
import '../../data/models/availability_model.dart';

class TimeSlotGrid extends StatelessWidget {
  final List<TimeSlot> slots;
  final TimeSlot? selectedSlot;
  final Function(TimeSlot) onSlotSelected;

  const TimeSlotGrid({
    Key? key,
    required this.slots,
    this.selectedSlot,
    required this.onSlotSelected,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (slots.isEmpty) {
      return const Center(
        child: Text('No time slots available'),
      );
    }

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: slots.map((slot) {
        final isSelected = selectedSlot?.id == slot.id;
        return InkWell(
          onTap: slot.isAvailable ? () => onSlotSelected(slot) : null,
          child: Container(
            padding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 8,
            ),
            decoration: BoxDecoration(
              color: _getSlotColor(slot, isSelected),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isSelected
                    ? Colors.green
                    : slot.isAvailable
                        ? Colors.transparent
                        : Colors.red.withOpacity(0.3),
              ),
            ),
            child: Text(
              slot.displayTime,
              style: TextStyle(
                color: _getTextColor(slot, isSelected),
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Color _getSlotColor(TimeSlot slot, bool isSelected) {
    if (isSelected) return Colors.green;
    if (!slot.isAvailable) return Colors.grey[300]!;
    return Colors.grey[200]!;
  }

  Color _getTextColor(TimeSlot slot, bool isSelected) {
    if (isSelected) return Colors.white;
    if (!slot.isAvailable) return Colors.grey[600]!;
    return Colors.black;
  }
}