import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../widgets/custom_text_field.dart';
import '../../../widgets/custom_dropdown_field.dart';
import '../../../core/utils/validators.dart';
import 'login_screen.dart';
import '../../../providers/auth_provider.dart';
import '../../../data/dto/user_dto.dart';
import '../../../widgets/password_field_text.dart';
import 'verify_email_dialog.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _dobController = TextEditingController();
  String? _selectedGender;
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();

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
                      child: TextFormField(
                        controller: _dobController,
                        readOnly: true,
                        decoration: InputDecoration(
                          labelText: "Ngày sinh",
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return "Vui lòng chọn ngày sinh";
                          }
                          return null;
                        },

                        onTap: () async {
                          DateTime? pickedDate = await showDatePicker(
                            context: context,
                            initialDate: _dobController.text.isNotEmpty
                                ? DateTime.parse(_dobController.text)
                                : DateTime(2000),
                            firstDate: DateTime(1900),
                            lastDate: DateTime.now(),
                          );
                          if (pickedDate != null) {
                            //format: yyyy-mm-dd
                            String formattedDate =
                                "${pickedDate.year}-${pickedDate.month.toString().padLeft(2, '0')}-${pickedDate.day.toString().padLeft(2, '0')}";
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
                        label: "Giới tính",
                        items: ["Nam", "Nữ", "Khác"],
                        value: _selectedGender,
                        onChanged: (value) {
                          setState(() {
                            _selectedGender = value;
                          });
                        },
                        validator: (value) =>
                            value == null ? "Vui lòng chọn giới tính" : null,
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

                PasswordTextField(
                  controller: _passwordController,
                  label: "Mật khẩu",
                  validator: Validators.validatePassword,
                ),
                const SizedBox(height: 16),

                PasswordTextField(
                  controller: _confirmController,
                  label: "Xác nhận mật khẩu",
                  confirmPassword: true,
                  originalPasswordController: _passwordController,
                ),
                const SizedBox(height: 20),

                // Nút đăng ký
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF396A30),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    onPressed: auth.isLoading
                        ? null
                        : () async {
                            final currentContext = context;

                            auth.resetError();
                            if (!_formKey.currentState!.validate()) return;

                            if (_selectedGender == null) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text("Vui lòng chọn giới tính"),
                                ),
                              );
                              return;
                            }

                            final success = await auth.register(
                              UserDTO(
                                username: _usernameController.text.trim(),
                                email: _emailController.text.trim(),
                                password: _passwordController.text,
                                birthdate: _dobController.text,
                                gender: _selectedGender!,
                              ),
                            );
                            if (!mounted) return;
                            if (success) {
                              // Clear form on success
                              _usernameController.clear();
                              _dobController.clear();
                              _selectedGender = null;
                              _emailController.clear();
                              _passwordController.clear();
                              _confirmController.clear();

                              // Hiển thị modal thông báo
                              await showDialog(
                                context: currentContext,
                                barrierDismissible: false,
                                builder: (context) =>
                                    const VerifyEmailToLoginDialog(),
                              );
                            } else {
                              if (mounted) {
                                ScaffoldMessenger.of(
                                  currentContext,
                                ).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      auth.error ?? "Đăng ký thất bại",
                                    ),
                                    backgroundColor: Colors.red,
                                  ),
                                );
                              }
                            }
                          },
                    child: auth.isLoading
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
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

