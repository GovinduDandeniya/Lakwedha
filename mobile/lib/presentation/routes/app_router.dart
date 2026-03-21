import 'package:flutter/material.dart';
import '../screens/splash/splash_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/shell/main_shell.dart';
import '../../features/auth/screens/sign_in_screen.dart';
import '../../features/auth/screens/sign_up_screen.dart';
import '../../features/auth/screens/forgot_password_screen.dart';

class AppRouter {
  AppRouter._();

  // Route names
  static const String splash         = '/';
  static const String signIn         = '/sign-in';
  static const String signUp         = '/sign-up';
  static const String forgotPassword = '/forgot-password';
  static const String home           = '/home';
  static const String login          = '/login';
  static const String register       = '/register';

  static Route<dynamic> generateRoute(RouteSettings settings) {
    switch (settings.name) {
      case splash:
        return _route(const SplashScreen());
      case signIn:
        return _route(const SignInScreen());
      case signUp:
        return _route(const SignUpScreen());
      case forgotPassword:
        return _route(const ForgotPasswordScreen());
      case home:
        return _route(const MainShell());
      case login:
        return _route(const LoginScreen());
      case register:
        return _route(const RegisterScreen());
      default:
        return _route(
          const Scaffold(
            body: Center(child: Text('Page not found')),
          ),
        );
    }
  }

  static MaterialPageRoute<dynamic> _route(Widget page) =>
      MaterialPageRoute(builder: (_) => page);
}
