import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class AuthGuard extends StatelessWidget {
  final Widget child;

  const AuthGuard({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        // Nếu đang load token từ local (ví dụ khi app mới mở)
        if (auth.isLoading) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        // Nếu chưa đăng nhập → chuyển về trang đăng nhập
        if (!auth.isLoggedIn) {
          // dùng Future.microtask để tránh gọi Navigator trong build
          Future.microtask(() {
            Navigator.pushReplacementNamed(context, '/login');
          });
          return const SizedBox.shrink(); // tránh render UI
        }

        // Nếu đã đăng nhập → render màn hình con (HomeScreen)
        return child;
      },
    );
  }
}
