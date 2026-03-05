import 'package:flutter/material.dart';

class QueueIndicator extends StatelessWidget {
  final int position;
  final int totalInQueue;

  const QueueIndicator({
    super.key,
    required this.position,
    required this.totalInQueue,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.orange[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.orange),
      ),
      child: Column(
        children: [
          const Text('Your Queue Position',
              style: TextStyle(color: Colors.orange, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(
            '$position / $totalInQueue',
            style: const TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: Colors.orange,
            ),
          ),
        ],
      ),
    );
  }
}
