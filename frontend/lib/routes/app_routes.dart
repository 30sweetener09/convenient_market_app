import 'package:flutter/material.dart';
import 'package:frontend/widgets/auth_guard.dart';
import '../screens/auth/login_screen.dart';
import '../screens/home/home_screen.dart';

class AppRoutes {
  static Map<String, WidgetBuilder> routes = {
    '/login': (context) => const LoginScreen(),
    '/home': (context) => const AuthGuard(child: HomeScreen()),
  };
}
