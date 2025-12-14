import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/auth_provider.dart';
import '../../../core/utils/validators.dart';
import '../../../widgets/custom_text_field.dart';
import '../../../widgets/custom_button.dart';
import './forgot_password_screen.dart';
import './register_screen.dart';

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
      backgroundColor: Colors.white,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              // crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Logo
                SizedBox(
                  width: 100,
                  height: 100,
                  child: Image.asset(
                    "assets/images/DiChoTienLoi_Logo_Green.png",
                    fit: BoxFit.contain,
                  ),
                ),
                const SizedBox(height: 24),

                // Tiêu đề
                const Text(
                  "Đăng nhập",
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.green,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 40),

                // Email
                CustomTextField(
                  controller: _emailController,
                  label: "Email",
                  validator: Validators.validateEmail,
                ),
                const SizedBox(height: 16),

                // Password
                CustomTextField(
                  controller: _passwordController,
                  label: "Mật khẩu",
                  obscureText: true,
                  validator: Validators.validatePassword,
                ),

                // Quên mật khẩu link
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const ForgotPasswordScreen(),
                        ),
                      );
                    },
                    child: const Text(
                      "Quên mật khẩu?",
                      style: TextStyle(color: Colors.blue),
                    ),
                  ),
                ),

                const SizedBox(height: 10),

                // Hiển thị lỗi nếu có
                if (auth.error != null)
                  Text(auth.error!, style: const TextStyle(color: Colors.red)),
                if (auth.error != null) const SizedBox(height: 20),

                // Nút đăng nhập
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    onPressed: auth.isLoading
                        ? null
                        : () async {
                      if (_formKey.currentState!.validate()) {
                        await auth.login(
                          _emailController.text,
                          _passwordController.text,
                        );
                        if (auth.isLoggedIn && context.mounted) {
                          Navigator.pushReplacementNamed(
                              context, '/home');
                        }
                      }
                    },
                    child: auth.isLoading
                        ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                        : const Text(
                      "Đăng nhập",
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // Đăng ký link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text("Là người dùng mới? "),
                    GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const RegisterScreen(),
                          ),
                        );
                      },
                      child: const Text(
                        "Đăng ký",
                        style: TextStyle(
                          color: Colors.blue,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
