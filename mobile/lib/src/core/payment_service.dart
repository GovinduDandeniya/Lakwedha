import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ravana_app/src/core/api_client.dart';

/// Lakwedha Payment Bridge
/// Orchestrates both Mobile (Stripe SDK) and Web (Preview Mock) flows.
class PaymentService {
  final Ref ref;

  PaymentService(this.ref);

  /// Main entry point to process a payment (Web only currently via PayHere JS)
  Future<void> processOrderPayment({
    required String orderId,
    required VoidCallback onSuccess,
    required Function(String error) onError,
  }) async {
    // For mobile, payment is handled via the web dashboard or direct PayHere integration (TBD)
    onError('Online payments are currently managed via the Web Dashboard.');
  }

  /// Process Cash on Delivery (COD) Flow
  Future<void> processCODPayment({
    required String orderId,
    required VoidCallback onSuccess,
    required Function(String error) onError,
  }) async {
    final dio = ref.read(dioProvider);
    try {
      await dio.put('/orders/$orderId/status', data: {
        'status': 'processing',
        'reason': 'Patient opted for Cash on Delivery'
      });
      onSuccess();
    } catch (e) {
      onError('Failed to process COD request: ${e.toString()}');
    }
  }
}

/// Global Provider for UI components to access payment logic
final paymentServiceProvider = Provider((ref) => PaymentService(ref));
