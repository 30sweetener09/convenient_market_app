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
  final _birthdateController = TextEditingController();
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

                _loginText(),
                const SizedBox(height: 40),

                _usernameField(),
                const SizedBox(height: 16),

                _birhdateAndGenderRow(),
                const SizedBox(height: 16),

                _emailField(),
                const SizedBox(height: 16),

                _passwordField(),
                const SizedBox(height: 16),

                _confirmPasswordField(),
                const SizedBox(height: 20),

                _registerButton(auth),
                const SizedBox(height: 16),

                _loginLink(),
                const SizedBox(height: 20),

                _buildLogo(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _loginText() {
    return const Text(
      "Đăng nhập",
      style: TextStyle(
        color: Color(0xFF396A30),
        fontSize: 40,
        fontFamily: 'Unbounded',
        fontWeight: FontWeight.w600,
      ),
    );
  }

  Widget _usernameField() {
    return CustomTextField(
      controller: _usernameController,
      obscureText: false,
      label: "Tên người dùng",
      validator: (value) =>
          Validators.validateNotEmpty(value, "tên người dùng"),
    );
  }

  Widget _emailField() {
    return CustomTextField(
      controller: _emailController,
      obscureText: false,
      label: "Email",
      validator: Validators.validateEmail,
    );
  }

  Widget _birhdateAndGenderRow() {
    return Row(
      children: [
        // Birthdate field
        Expanded(child: _birthdateField()),
        const SizedBox(width: 16),
        // Gender field
        Expanded(child: _genderField()),
      ],
    );
  }

  Widget _birthdateField() {
    return TextFormField(
      controller: _birthdateController,
      readOnly: true,
      decoration: InputDecoration(
        labelText: "Ngày sinh",
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
      ),
      validator: (value) =>
          (value == null || value.isEmpty) ? "Vui lòng chọn ngày sinh" : null,
      onTap: _handleDatePicker,
    );
  }

  void _handleDatePicker() async {
    DateTime? pickedDate = await showDatePicker(
      context: context,
      initialDate: _birthdateController.text.isNotEmpty
          ? DateTime.parse(_birthdateController.text)
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
        _birthdateController.text = formattedDate;
      });
    }
  }

  Widget _genderField() {
    return CustomDropdownField(
      label: "Giới tính",
      items: ["Nam", "Nữ", "Khác"],
      value: _selectedGender,
      onChanged: (value) {
        setState(() {
          _selectedGender = value;
        });
      },
      validator: (value) => value == null ? "Vui lòng chọn giới tính" : null,
    );
  }

  Widget _passwordField() {
    return PasswordTextField(
      controller: _passwordController,
      label: "Mật khẩu",
      validator: Validators.validatePassword,
    );
  }

  Widget _confirmPasswordField() {
    return PasswordTextField(
      controller: _confirmController,
      label: "Xác nhận mật khẩu",
      confirmPassword: true,
      originalPasswordController: _passwordController,
    );
  }

  Widget _loginLink() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Text("Đã có tài khoản? "),
        GestureDetector(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const LoginScreen()),
            );
          },
          child: const Text(
            "Đăng nhập",
            style: TextStyle(color: Colors.blue, fontWeight: FontWeight.bold),
          ),
        ),
      ],
    );
  }

  Widget _buildLogo() {
    return SizedBox(
      width: 100,
      height: 100,
      child: Image.asset("assets/images/logo_white.png", fit: BoxFit.contain),
    );
  }

  Widget _registerButton(AuthProvider auth) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF396A30),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
        ),
        onPressed: auth.isLoading ? null : () => _handleRegister(auth),
        child: auth.isLoading ? _buildLoadingIndicator() : _buildButtonText(),
      ),
    );
  }

  void _handleRegister(AuthProvider auth) async {
    auth.resetError();
    if (!_formKey.currentState!.validate()) return;

    if (_selectedGender == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("Vui lòng chọn giới tính")));
      return;
    }

    final success = await auth.register(
      UserDTO(
        username: _usernameController.text.trim(),
        email: _emailController.text.trim(),
        password: _passwordController.text,
        birthdate: _birthdateController.text,
        gender: _selectedGender!,
      ),
    );
    if (!mounted) return;
    if (success) {
      // Clear form on success
      _usernameController.clear();
      _birthdateController.clear();
      _selectedGender = null;
      _emailController.clear();
      _passwordController.clear();
      _confirmController.clear();

      // Hiển thị modal thông báo
      await showDialog(
        context: context,
        barrierDismissible: true,
        builder: (context) => VerifyEmailDialog(
          email: _emailController.text.trim(),
          route: '/login',
        ),
      );
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(auth.error ?? "Đăng ký thất bại"),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
  Widget _buildLoadingIndicator() => const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white));
  Widget _buildButtonText() => const Text("Đăng ký", style: TextStyle(fontSize: 24, fontFamily: 'Nunito', fontWeight: FontWeight.w700));

  
}