import 'package:flutter/material.dart';
import '../../auth/login_screen.dart';

class DeleteAccDialog extends StatelessWidget {
  final Future<void> Function() onConfirmDelete;
  const DeleteAccDialog({super.key, required this.onConfirmDelete,});

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
      ),
      title: const Text(
        'Bạn có muốn xoá tài khoản?',
        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 24),
      ),
      content: const Text(
        'Tài khoản này sẽ không thể được sử dụng để đăng nhập lại trên ứng dụng này nữa',
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
            await onConfirmDelete();
            if (!context.mounted) return;
    
            Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(builder: (_) => const LoginScreen()),
              (route) => false,
            );
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
