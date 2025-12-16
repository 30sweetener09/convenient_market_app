import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../widgets/custom_text_field.dart';
import '../../../widgets/custom_dropdown_field.dart';
import '../../../core/utils/validators.dart';
import './login_screen.dart';
import '../../../providers/auth_provider.dart';
import '../../../data/dto/user_dto.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _dobController = TextEditingController();
  final _genderController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final auth = context.read<AuthProvider>();

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
                const SizedBox(height: 30),
                const Text(
                  "Đăng ký",
                  style: TextStyle(
                    color: Color(0xFF396A30),
                    fontSize: 40,
                    fontFamily: 'Unbounded',
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 40),

                CustomTextField(
                  controller: _usernameController,
                  obscureText: false,
                  label: "Tên người dùng",
                  validator: (value) =>
                      Validators.validateNotEmpty(value, "tên người dùng"),
                ),
                const SizedBox(height: 16),

                Row(
                  children: [
                    //ngày sinh - date of birth
                    Expanded(
                      child: TextField(
                        controller: _dobController,
                        decoration: InputDecoration(
                          labelText: "Ngày sinh",
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        readOnly: true,
                        onTap: () async {
                          DateTime? pickedDate = await showDatePicker(
                            context: context,
                            initialDate: DateTime.now(),
                            firstDate: DateTime(1900),
                            lastDate: DateTime.now(),
                          );
                          if (pickedDate != null) {
                            String formattedDate =
                                "${pickedDate.day}/${pickedDate.month}/${pickedDate.year}";
                            setState(() {
                              // Update the text field with the selected date
                              _dobController.text = formattedDate;
                            });
                          }
                        },
                      ),
                    ),
                    const SizedBox(width: 16),

                    //giới tính - gender
                    Expanded(
                      child: CustomDropdownField(
                        controller: _genderController,
                        label: "Giới tính",
                        items: ["Nam", "Nữ", "Khác"],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

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
                const SizedBox(height: 16),

                CustomTextField(
                  controller: _confirmController,
                  label: "Xác nhận mật khẩu",
                  obscureText: true,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return "Vui lòng xác nhận mật khẩu";
                    }
                    if (value != _passwordController.text) {
                      return "Mật khẩu không khớp";
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 20),

                // Nút đăng ký
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Color(0xFF396A30),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    onPressed: () async {
                      if (!_formKey.currentState!.validate()) return;
                      final success = await auth.register(
                        UserDTO(
                          name: _usernameController.text,
                          email: _emailController.text,
                          password: _passwordController.text,
                        ),
                      );

                      if (!mounted) return;
                      if (success) {
                        // Hiện dialog thành công
                        showDialog(
                          context: context,
                          barrierDismissible: false,
                          builder: (dialogContext) => AlertDialog(
                            title: const Text("🎉 Thành công"),
                            content: const Text("Đăng ký thành công"),
                            actions: [
                              TextButton(
                                onPressed: () {
                                  Navigator.pop(dialogContext); // đóng dialog
                                  Navigator.pushReplacementNamed(
                                    context,
                                    '/login',
                                  );
                                },
                                child: const Text("OK"),
                              ),
                            ],
                          ),
                        );
                      } else {
                        // Hiện SnackBar lỗi
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(auth.error ?? "Đăng ký thất bại"),
                          ),
                        );
                      }
                      // quay lại Login
                    },
                    child: auth.isLoading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text(
                      "Đăng ký",
                      style: TextStyle(
                        fontSize: 24,
                        fontFamily: 'Nunito',
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text("Đã có tài khoản? "),
                    GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const LoginScreen(),
                          ),
                        );
                      },
                      child: const Text(
                        "Đăng nhập",
                        style: TextStyle(
                          color: Colors.blue,
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
