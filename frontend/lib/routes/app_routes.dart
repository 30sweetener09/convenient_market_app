import 'package:flutter/material.dart';
import '../widgets/auth_guard.dart';
import '../screens/auth/login_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/auth/forgot_password_screen.dart';
import '../screens/auth/reset_password_screen.dart';

class AppRoutes {
  static Map<String, WidgetBuilder> routes = {
    '/login': (context) => const LoginScreen(),
    '/signup': (context) => const RegisterScreen(),
    '/forgot_pass': (context) => const ForgotPasswordScreen(),
    '/home': (context) => const AuthGuard(child: HomeScreen()),
    '/reset_pass': (context) => const ResetPasswordScreen(),
  };
}
