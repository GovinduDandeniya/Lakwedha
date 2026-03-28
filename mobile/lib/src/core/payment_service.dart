import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ravana_app/src/core/api_client.dart';
import 'dart:async';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'payment_js_helper.dart';

/// Lakwedha Payment Bridge
class PaymentService {
  final Ref ref;

  PaymentService(this.ref);

  /// Process payment via PayHere JS SDK (Web only)
  Future<void> processOrderPayment({
    required String orderId,
    required VoidCallback onSuccess,
    required Function(String error) onError,
  }) async {
    final dio = ref.read(dioProvider);

    try {
      if (kIsWeb) {
        // Wait for payhere to be available on window
        bool sdkLoaded = false;
        for (int i = 0; i < 20; i++) {
          if (isPayhereLoaded()) {
            sdkLoaded = true;
            break;
          }
          await Future.delayed(const Duration(milliseconds: 500));
        }

        if (!sdkLoaded) {
          // Try injecting script one more time via eval
          injectPayhereScript();

          // Wait another 5 seconds after injection
          for (int i = 0; i < 10; i++) {
            await Future.delayed(const Duration(milliseconds: 500));
            if (isPayhereLoaded()) {
              sdkLoaded = true;
              break;
            }
          }
        }

        if (!sdkLoaded) {
          onError('PayHere SDK could not be loaded. Check your internet connection and try again.');
          return;
        }

        final res = await dio.post('/api/orders/$orderId/pay/initiate');
        final paymentData = res.data['data'];

        if (paymentData != null) {
          startPayherePayment(
            paymentData: paymentData,
            onCompleted: (_) {
              dio.post('/api/orders/$orderId/pay/confirm').then((confirmRes) {
                if (confirmRes.data['success'] == true) {
                  onSuccess();
                } else {
                  onError(confirmRes.data['message'] ?? 'Payment verification failed.');
                }
              }).catchError((e) {
                onError(e.toString());
              });
            },
            onDismissed: () {
              onError('Payment was cancelled.');
            },
            onError: (err) {
              onError('Payment Error: $err');
            },
          );
        }
        return;
      }

      onError('Online payments are only available on the web app.');
    } catch (e) {
      onError('Could not start payment: ${e.toString()}');
    }
  }

  /// Process appointment payment.
  /// Web uses PayHere JS checkout; mobile uses initiate+confirm fallback flow.
  Future<void> processAppointmentPayment({
    required String appointmentId,
    required VoidCallback onSuccess,
    required Function(String error) onError,
  }) async {
    final dio = ref.read(dioProvider);

    try {
      if (kIsWeb) {
        final res = await dio.post('/api/v1/doctor-channeling/appointments/$appointmentId/pay/initiate');
        bool sdkLoaded = false;
        for (int i = 0; i < 20; i++) {
          if (isPayhereLoaded()) {
            sdkLoaded = true;
            break;
          }
          await Future.delayed(const Duration(milliseconds: 500));
        }

        if (!sdkLoaded) {
          onError('PayHere SDK could not be loaded. Check your internet connection.');
          return;
        }

        final paymentData = res.data['data'];

        if (paymentData != null) {
          startPayherePayment(
            paymentData: paymentData,
            onCompleted: (_) {
              dio.post('/api/v1/doctor-channeling/appointments/$appointmentId/pay/confirm').then((confirmRes) {
                if (confirmRes.data['success'] == true) {
                  onSuccess();
                } else {
                  onError(confirmRes.data['message'] ?? 'Payment verification failed.');
                }
              }).catchError((e) {
                onError(e.toString());
              });
            },
            onDismissed: () {
              onError('Payment was cancelled.');
            },
            onError: (err) {
              onError('Payment Error: $err');
            },
          );
        } else {
          onError('Payment parameters are missing.');
        }
        return;
      }

      // Mobile fallback: confirm directly without web PayHere initialization.
      final confirmRes = await dio.post('/api/v1/doctor-channeling/appointments/$appointmentId/pay/confirm');
      if (confirmRes.data['success'] == true) {
        onSuccess();
      } else {
        onError(confirmRes.data['message'] ?? 'Payment verification failed.');
      }
    } catch (e) {
      onError('Could not start payment: ${e.toString()}');
    }
  }

  /// Process Cash on Delivery (COD) Flow
  Future<void> processCODPayment({
    required String orderId,
    required VoidCallback onSuccess,
    required Function(String error) onError,
  }) async {
    final dio = ref.read(dioProvider);
    try {
      await dio.put('/api/orders/$orderId/status', data: {
        'status': 'processing',
        'reason': 'Patient opted for Cash on Delivery',
      });
      onSuccess();
    } catch (e) {
      onError('Failed to process COD: ${e.toString()}');
    }
  }
}

/// Global Provider
final paymentServiceProvider = Provider((ref) => PaymentService(ref));
