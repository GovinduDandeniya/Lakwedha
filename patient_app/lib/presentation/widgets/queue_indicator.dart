import 'package:flutter/material.dart';

class QueueIndicator extends StatelessWidget {
  final int position;
  final int totalInQueue;
  final int? estimatedWaitMinutes;

  const QueueIndicator({
    Key? key,
    required this.position,
    required this.totalInQueue,
    this.estimatedWaitMinutes,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.orange.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.orange),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.timer, color: Colors.orange),
              const SizedBox(width: 8),
              Text(
                'Queue Position: $position',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.orange,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'People ahead of you: ${position - 1}',
            style: const TextStyle(fontSize: 14),
          ),
          if (estimatedWaitMinutes != null) ...[
            const SizedBox(height: 4),
            Text(
              'Estimated wait: $estimatedWaitMinutes minutes',
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
            ),
          ],
          const SizedBox(height: 12),
          LinearProgressIndicator(
            value: (position) / totalInQueue,
            backgroundColor: Colors.grey[300],
            valueColor: const AlwaysStoppedAnimation<Color>(Colors.orange),
          ),
        ],
      ),
    );
  }
}