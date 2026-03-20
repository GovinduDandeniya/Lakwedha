import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return android; // reuse Android config for web testing
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return android; // iOS uses same project; add iOS config if needed
      case TargetPlatform.windows:
      case TargetPlatform.macOS:
      case TargetPlatform.linux:
        return android; // desktop: Firebase Core works, FCM push not supported
      default:
        return android;
    }
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyCHlE2VY2EG9FmlGEZ5IWWbI83SAHCC_60',
    appId: '1:408380077951:android:dd1e72d75ef036baaacc4a',
    messagingSenderId: '408380077951',
    projectId: 'lakwedha-1c7da',
    storageBucket: 'lakwedha-1c7da.firebasestorage.app',
  );
}
