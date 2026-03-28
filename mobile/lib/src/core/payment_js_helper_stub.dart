bool isPayhereLoaded() => false;

void injectPayhereScript() {}

void startPayherePayment({
  required dynamic paymentData,
  required void Function(dynamic) onCompleted,
  required void Function() onDismissed,
  required void Function(dynamic) onError,
}) {}
