import 'package:flutter/material.dart';
import '../../../core/utils/validators.dart';
import '../../../widgets/custom_text_field.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();

  @override
  Widget build(BuildContext context) {
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

                const Text(
                  "Quên mật khẩu",
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.green,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 40),

                CustomTextField(
                  controller: _emailController,
                  label: "Email",
                  validator: Validators.validateEmail,
                ),
                const SizedBox(height: 20),

                // Nút gửi email
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    onPressed: () {
                      if (_formKey.currentState!.validate()) {
                        // TODO: call API gửi reset password
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text("Link khôi phục mật khẩu đã gửi"),
                          ),
                        );
                      }
                    },
                    child: const Text(
                      "Gửi",
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
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
