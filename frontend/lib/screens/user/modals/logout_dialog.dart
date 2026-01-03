import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/auth_provider.dart';
import '../../auth/login_screen.dart';

class LogoutDialog extends StatelessWidget {
  final Future<void> Function() onConfirmLogout;
  const LogoutDialog({super.key, required this.onConfirmLogout});

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
      ),
      title: const Text(
        'Bạn có muốn đăng xuất?',
        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 24),
      ),
      content: const Text(
        'Nếu muốn sử dụng lại ứng dụng bạn cần đăng nhập lại.',
        style: TextStyle(fontSize: 16),
      ),
      actions: [
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF4F6F3A),
            minimumSize: const Size(double.infinity, 48),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(24),
            ),
          ),
          onPressed: () async {
            await context.read<AuthProvider>().logout();

            if (context.mounted) {
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (route) => false,
              );
            }
          },
          child: const Text('Xác nhận', style: TextStyle(color: Colors.white, fontSize: 20)),
        ),
        const SizedBox (height: 8),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color.fromARGB(189, 255, 255, 255),
            minimumSize: const Size(double.infinity, 48),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(24),
            ),
          ),
          onPressed: () => Navigator.pop(context),
          child: const Text(
            'Huỷ',
            style: TextStyle(color: Colors.red, fontSize: 20),
          ),
        ),
      ],
    );
  }
}
