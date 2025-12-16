import 'package:flutter/material.dart';
<<<<<<< HEAD
import '../screens/home/home_screen.dart';
=======
>>>>>>> 6134029d30e5bea7d87cb744d077754cb39bf252
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'screens/splash/splash_screen.dart';

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
<<<<<<< HEAD
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
=======
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Convenient Market',
      home: const SplashScreen(), // Load splash trước
>>>>>>> 6134029d30e5bea7d87cb744d077754cb39bf252
    );
  }
}
