import 'package:flutter/material.dart';
import '../screens/home/home_screen.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'routes/app_routes.dart';
import 'screens/auth/login_screen.dart';
import 'widgets/auth_guard.dart';

void main() {
  runApp(
    ChangeNotifierProvider(
      create: (_) => AuthProvider(),
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        return MaterialApp(
          debugShowCheckedModeBanner: false,
          title: 'Convenient Market',

          // ✅ Nếu đã đăng nhập thì vào /home, chưa thì /login
          initialRoute: auth.isLoggedIn ? '/home' : '/login',

          // ✅ Các route trong app
          routes: AppRoutes.routes,
          theme: ThemeData(
            fontFamily: 'Nunito'
          ),
        );
      },
    );
  }
}
