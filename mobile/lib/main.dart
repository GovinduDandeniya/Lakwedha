import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:google_fonts/google_fonts.dart';
import 'firebase_options.dart';
import 'package:provider/provider.dart';
import 'presentation/providers/auth_provider.dart';
import 'presentation/providers/booking_provider.dart';
import 'presentation/providers/appointment_provider.dart';
import 'presentation/screens/splash/splash_screen.dart';
import 'features/auth/screens/sign_in_screen.dart';
import 'features/auth/screens/sign_up_screen.dart';
import 'features/auth/screens/forgot_password_screen.dart';
import 'presentation/screens/shell/main_shell.dart';

/// Top-level background message handler — must be outside any class.
@pragma('vm:entry-point')
Future<void> _firebaseBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  debugPrint('Background message: ${message.notification?.title}');
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  // Handle messages received while app is terminated / in background
  FirebaseMessaging.onBackgroundMessage(_firebaseBackgroundHandler);

  // Handle messages received while app is in foreground
  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    debugPrint('Foreground message: ${message.notification?.title}');
    // The notification is received — UI refresh or in-app banner can be triggered here
  });

  runApp(const RavanaApp());
}

class RavanaApp extends StatelessWidget {
  const RavanaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => BookingProvider()),
        ChangeNotifierProvider(create: (_) => AppointmentProvider()),

      ],
      child: MaterialApp(
        title: 'Lakwedha',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          primaryColor: const Color(0xFF2E7D32),
          colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2E7D32)),
          textTheme: GoogleFonts.poppinsTextTheme(),
          scaffoldBackgroundColor: const Color(0xFFF0F4F8),
          appBarTheme: AppBarTheme(
            elevation: 0,
            centerTitle: true,
            titleTextStyle: GoogleFonts.poppins(
              fontWeight: FontWeight.w700,
              fontSize: 18,
              color: Colors.white,
            ),
          ),
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF2E7D32),
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 45),
              textStyle: GoogleFonts.poppins(fontWeight: FontWeight.w600),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
          ),
        ),
        initialRoute: '/',
        routes: {
          '/':                    (context) => const SplashScreen(),
          '/sign-in':             (context) => const SignInScreen(),
          '/sign-up':             (context) => const SignUpScreen(),
          '/forgot-password':     (context) => const ForgotPasswordScreen(),
          '/home':                (context) => const MainShell(),
        },
      ),
    );
  }
}
