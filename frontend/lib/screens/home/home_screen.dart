import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/user_provider.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.read<UserProvider>();
    return Scaffold(
      appBar: AppBar(
        title: const Text("Trang chủ"),
        
      ),
      body: const Center(
        child: Text("Chào mừng bạn!"),
      ),
    );
  }
}
