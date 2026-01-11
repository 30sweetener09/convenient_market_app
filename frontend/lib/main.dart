import 'package:di_cho_tien_loi/providers/food_provider.dart';
import 'package:di_cho_tien_loi/providers/fridge_item_provider.dart';
import 'package:di_cho_tien_loi/providers/fridge_provider.dart';
import 'package:di_cho_tien_loi/providers/group_provider.dart';
import 'package:di_cho_tien_loi/providers/meal_plan_provider.dart';
import 'package:di_cho_tien_loi/providers/meal_task_provider.dart';
import 'package:di_cho_tien_loi/providers/recipe_provider.dart';
import 'package:di_cho_tien_loi/providers/user_provider.dart';
import 'package:flutter/material.dart';
import '../screens/home/home_screen.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'routes/app_routes.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const MyApp());
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => RecipeProvider()),
        ChangeNotifierProvider(create: (_) => UserProvider()),
        ChangeNotifierProvider(create: (_) => GroupProvider()),

        ChangeNotifierProvider(create: (_) => FoodProvider()),
        ChangeNotifierProvider(create: (_) => MealPlanProvider()),
        ChangeNotifierProvider(create: (_) => MealTaskProvider()),
        ChangeNotifierProvider(create: (_) => FridgeProvider()),
        ChangeNotifierProvider(create: (_) => FridgeItemProvider()),
      ],
      child: const MyApp()
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
                        onPressed: () => Navigator.pushReplacementNamed(context, '/login'),
                        child: const Text('Về trang đăng nhập'),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
          theme: ThemeData(
            fontFamily: 'Nunito',
            //primaryColor: Color(0xFF396A30),
            //brightness: Brightness.light,
            colorScheme: ColorScheme(
              brightness: Brightness.light, // Nền sáng
              primary: const Color(0xFF396A30), // Màu chính
              onPrimary: Colors.white, // Màu chữ trên nền primary
              secondary: const Color(0xFF4CAF50), // Màu phụ (có thể điều chỉnh)
              onSecondary: Colors.white,
              error: Colors.red,
              onError: Colors.white,
              surface: const Color.fromARGB(255, 255, 255, 255), // Bề mặt components
              onSurface: Colors.black, // Chữ trên bề mặt
              outline: const Color(0xFFE0E0E0), // Đường viền
            ),

          ),
        );
      },
    );
  }
}
