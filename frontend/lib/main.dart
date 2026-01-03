import 'package:di_cho_tien_loi/providers/group_provider.dart';
import 'package:di_cho_tien_loi/providers/recipe_provider.dart';
import 'package:di_cho_tien_loi/providers/user_provider.dart';
import 'package:flutter/material.dart';

import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'routes/app_routes.dart';

void main() {
  runApp(
    ChangeNotifierProvider(create: (_) => AuthProvider(), child: const MyApp()),
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
          onUnknownRoute: (settings) {
            debugPrint('Unknown route: ${settings.name}');
            return MaterialPageRoute(
              builder: (context) => Scaffold(
                appBar: AppBar(title: const Text('Lỗi')),
                body: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        'Trang không tồn tại',
                        style: TextStyle(fontSize: 20),
                      ),
                      const SizedBox(height: 20),
                      ElevatedButton(
                        onPressed: () =>
                            Navigator.pushReplacementNamed(context, '/login'),
                        child: const Text('Về trang đăng nhập'),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
          theme: ThemeData(fontFamily: 'Nunito'),
        );
      },
    );
  }
}
