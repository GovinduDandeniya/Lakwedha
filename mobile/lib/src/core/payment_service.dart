import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ravana_app/src/core/api_client.dart';
import 'dart:js' as js;
import 'dart:async';
import 'package:flutter/foundation.dart' show kIsWeb;

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
          if (js.context.hasProperty('payhere')) {
            sdkLoaded = true;
            break;
          }
          await Future.delayed(const Duration(milliseconds: 500));
        }

        if (!sdkLoaded) {
          // Try injecting script one more time via eval
          js.context.callMethod('eval', ['''
            (function() {
              var script = document.createElement('script');
              script.src = 'https://www.payhere.lk/lib/payhere.js';
              script.type = 'text/javascript';
              document.head.appendChild(script);
            })();
          ''']);
          
          // Wait another 5 seconds after injection
          for (int i = 0; i < 10; i++) {
            await Future.delayed(const Duration(milliseconds: 500));
            if (js.context.hasProperty('payhere')) {
              sdkLoaded = true;
              break;
            }
          }
        }

        if (!sdkLoaded) {
          onError('PayHere SDK could not be loaded. Check your internet connection and try again.');
          return;
        }

        final res = await dio.post('/orders/$orderId/pay/initiate');
        final paymentData = res.data['data'];

        if (paymentData != null) {
          js.context['payhere']['onCompleted'] = js.allowInterop((oId) async {
            try {
              final confirmRes = await dio.post('/orders/$orderId/pay/confirm');
              if (confirmRes.data['success'] == true) {
                onSuccess();
              } else {
                onError(confirmRes.data['message'] ?? 'Payment verification failed.');
              }
            } catch (e) {
              onError(e.toString());
            }
          });

          js.context['payhere']['onDismissed'] = js.allowInterop(() {
            onError('Payment was cancelled.');
          });

          js.context['payhere']['onError'] = js.allowInterop((err) {
            onError('Payment Error: $err');
          });

          final jsPayment = js.JsObject.jsify(paymentData);
          js.context['payhere'].callMethod('startPayment', [jsPayment]);
        }
        return;
      }

      onError('Online payments are only available on the web app.');
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
      await dio.put('/orders/$orderId/status', data: {
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
