import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/auth_provider.dart';
import '../../../core/utils/validators.dart';
import '../../../widgets/custom_text_field.dart';
import '../../../widgets/custom_button.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: Colors.blue[50],
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                const Text("Đăng nhập",
                    style:
                    TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
                const SizedBox(height: 40),
                CustomTextField(
                  controller: _emailController,
                  label: "Email",
                  validator: Validators.validateEmail,
                ),
                const SizedBox(height: 16),
                CustomTextField(
                  controller: _passwordController,
                  label: "Mật khẩu",
                  obscureText: true,
                  validator: Validators.validatePassword,
                ),
                const SizedBox(height: 20),
                if (auth.error != null)
                  Text(auth.error!, style: const TextStyle(color: Colors.red)),
                const SizedBox(height: 20),
                CustomButton(
                  label: "Đăng nhập",
                  loading: auth.isLoading,
                  onPressed: () async {
                    if (_formKey.currentState!.validate()) {
                      await auth.login(
                          _emailController.text, _passwordController.text);
                      if (auth.isLoggedIn && context.mounted) {
                        Navigator.pushReplacementNamed(context, '/home');
                      }
                    }
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
