import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/utils/validators.dart';
import '../../../widgets/custom_text_field.dart';
import '../../../widgets/return_login_dialog.dart';
import '../../../providers/auth_provider.dart';

class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({super.key});

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final String email = ModalRoute.of(context)!.settings.arguments as String;
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text("Đặt lại mật khẩu"),
        // Thuộc tính leading cho phép đặt Widget ở vị trí đầu (thường là bên trái)
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios), // Icon quay lại
          onPressed: () {
            Navigator.pushNamed(context, "/login");
          },
        ),
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              // crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildHeader(),
                const SizedBox(height: 30),

                CustomTextField(
                  controller: _passwordController,
                  label: "Nhập mật khẩu mới",
                  validator: Validators.validatePassword,
                ),
                const SizedBox(height: 20),

                CustomTextField(
                  controller: _confirmPasswordController,
                  label: "Xác nhận mật khẩu mới",
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return "Vui lòng xác nhận mật khẩu";
                    }
                    if (value != _passwordController.text) {
                      return "Mật khẩu xác nhận không khớp";
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 20),

                // Nút gửi password
                _buildConfirmButton(auth, email),
                const SizedBox(height: 40),

                //logo
                _buildLogo()
              ],
            ),
          ),
        ),
      ),
    );
  }
  Widget _buildConfirmButton(AuthProvider auth, String email) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF396A30),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
        ),
        onPressed: auth.isLoading ? null : () => _handleResetPassword(auth, email),
        child: auth.isLoading 
          ? const CircularProgressIndicator(color: Colors.white)
          : const Text("Xác nhận", style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
      ),
    );
  }

  void _handleResetPassword(AuthProvider auth, String email) async {
    if (!_formKey.currentState!.validate()) return;

    // Giả sử API của bạn cần cả email và password mới
    final success = await auth.changePassword(_passwordController.text);

    if (!mounted) return;

    if (success) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const ReturnLoginDialog(
          title: "Đặt lại mật khẩu thành công",
          message: "Mật khẩu của bạn đã được đặt lại thành công. Vui lòng đăng nhập lại.",
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(auth.error ?? "Đặt lại mật khẩu thất bại"),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  // Các hàm helper cho UI sạch hơn...
  Widget _buildHeader() => const Column(children: [
    Text("Đặt lại mật khẩu", style: TextStyle(color: Color(0xFF396A30), fontSize: 36, fontWeight: FontWeight.bold)),
    SizedBox(height: 10),
    Text("Hãy điền mật khẩu bạn muốn sử dụng ở dưới!", textAlign: TextAlign.center),
  ]);

  Widget _buildLogo() => SizedBox(width: 100, height: 100, child: Image.asset("assets/images/logo_white.png"));
}