import 'package:di_cho_tien_loi/providers/user_provider.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/auth_provider.dart';
import '../../../core/utils/validators.dart';
import '../../../widgets/custom_text_field.dart';
import '../../../widgets/custom_button.dart';
import './forgot_password_screen.dart';
import './register_screen.dart';
import '../../../widgets/password_field_text.dart';

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
                const Text(
                  "Đăng nhập",
                  style: TextStyle(
                    color: Color(0xFF396A30),
                    fontSize: 40,
                    fontFamily: 'Unbounded',
                    fontWeight: FontWeight.w600,
                  ),
                ),

                const SizedBox(height: 40),

                CustomTextField(
                  controller: _emailController,
                  obscureText: false,
                  label: "Nhập email của bạn",
                  validator: Validators.validateEmail,
                ),

                const SizedBox(height: 16),

                PasswordTextField(
                  controller: _passwordController,
                  label: "Nhập mật khẩu",
                  validator: Validators.validatePassword,
                ),

                const SizedBox(height: 16),

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
                      style: TextStyle(color: Color(0xFF0088FF)),
                    ),
                  ),
                ),

                if (auth.error != null)
                  Text(
                    "Không kết nối được với server!",
                    style: const TextStyle(color: Colors.red),
                  ),

                const SizedBox(height: 16),

                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: auth.isLoading
                        ? null
                        : () async {
                            if (_formKey.currentState!.validate()) {
                              await auth.login(
                                _emailController.text.trim(),
                                _passwordController.text,
                              );

                              if (auth.isLoggedIn && context.mounted) {
                                context.read<UserProvider>().clearUser();
                                _emailController.clear();
                                _passwordController.clear();
                                Navigator.pushReplacementNamed(
                                  context,
                                  '/home',
                                );
                              }
                            }
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF396A30),
                      disabledBackgroundColor: const Color.fromARGB(255, 144, 144, 144), // giữ màu khi loading
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(32),
                      ),
                      elevation: 0,
                    ),
                    child: auth.isLoading
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              color: Colors.white,
                            ),
                          )
                        : const Text(
                            'Đăng nhập',
                            style: TextStyle(
                              fontSize: 24,
                              color: Colors.white,
                              fontFamily: 'Nunito',
                              fontWeight: FontWeight.w700,
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
                          color: Color(0xFF0088FF),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 20),

                //logo
                SizedBox(
                  width: 100,
                  height: 100,
                  child: Image.asset(
                    "assets/images/logo_white.png",
                    fit: BoxFit.contain,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
