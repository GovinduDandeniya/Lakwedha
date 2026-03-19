import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'presentation/providers/auth_provider.dart';
import 'presentation/providers/booking_provider.dart';
import 'presentation/providers/appointment_provider.dart';
import 'presentation/screens/splash/splash_screen.dart';
import 'features/auth/screens/sign_in_screen.dart';
import 'features/auth/screens/sign_up_screen.dart';
import 'features/auth/screens/forgot_password_screen.dart';
import 'presentation/screens/shell/main_shell.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
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
