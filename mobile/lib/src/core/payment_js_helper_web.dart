import 'dart:js_interop';
import 'dart:js_interop_unsafe';

bool isPayhereLoaded() {
  return globalContext.hasProperty('payhere'.toJS).toDart;
}

void injectPayhereScript() {
  globalContext.callMethod('eval'.toJS, '''
    (function() {
      var script = document.createElement('script');
      script.src = 'https://www.payhere.lk/lib/payhere.js';
      script.type = 'text/javascript';
      document.head.appendChild(script);
    })();
  '''.toJS);
}

void startPayherePayment({
  required dynamic paymentData,
  required void Function(dynamic) onCompleted,
  required void Function() onDismissed,
  required void Function(dynamic) onError,
}) {
  final payhere = globalContext['payhere'] as JSObject;
  payhere['onCompleted'] = (JSAny? oId) {
    onCompleted(oId);
  }.toJS;
  payhere['onDismissed'] = () {
    onDismissed();
  }.toJS;
  payhere['onError'] = (JSAny? err) {
    onError(err);
  }.toJS;
  final jsPayment = (paymentData as Object?).jsify();
  payhere.callMethodVarArgs('startPayment'.toJS, [jsPayment]);
}
