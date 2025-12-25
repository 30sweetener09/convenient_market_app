import 'package:flutter/material.dart';
import '../../../core/utils/validators.dart';
import '../../../widgets/custom_text_field.dart';
import 'verify_email_dialog.dart';
import 'package:provider/provider.dart';
import '../../../providers/auth_provider.dart';

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
      appBar: AppBar(
        //title: const Text("Quên mật khẩu"),
        // Thuộc tính leading cho phép đặt Widget ở vị trí đầu (thường là bên trái)
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios), // Icon quay lại
          onPressed: () {
            // Sử dụng Navigator.pop(context) để quay lại màn hình trước
            Navigator.pop(context);
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
                _titleText(),
                const SizedBox(height: 20),
                _instructionText(),
                const SizedBox(height: 20),

                CustomTextField(
                  controller: _emailController,
                  label: "Email",
                  validator: Validators.validateEmail,
                ),
                const SizedBox(height: 20),

                // Nút gửi email
                _emailSendButton(),
                const SizedBox(height: 40),

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

  Widget _titleText() {
    return const Text(
      "Quên mật khẩu",
      style: TextStyle(
        color: Color(0xFF396A30),
        fontSize: 36,
        fontFamily: 'Unbounded',
        fontWeight: FontWeight.w600,
      ),
    );
  }

  Widget _instructionText() {
    return const Text(
      "Hãy nhập email bạn đã sử dụng. Ứng dụng sẽ gửi link đến gmail của bạn để xác minh gmail và đặt lại mật khẩu.",
      style: TextStyle(
        color: Colors.black,
        fontSize: 16,
        fontFamily: 'Nunito',
        fontWeight: FontWeight.w300,
      ),
    );
  }

  Widget _emailSendButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: Color(0xFF396A30),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
        ),
        onPressed: () => _handleSendEmail(),
        child: const Text(
          "Gửi",
          style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
        ),
      ),
    );
  }

  void _handleSendEmail() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthProvider>(); // Đọc AuthProvider
    final email = _emailController.text.trim();

    // 1. Gọi API gửi mã trước khi hiện Modal
    final isSent = await auth.sendVerificationEmail(email);
    if (!mounted) return;

    if (isSent) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Mã xác thực đã được gửi đến Email của bạn"),
        ),
      );

      final bool? isVerified = await showDialog<bool>(
        context: context,
        barrierDismissible: false,
        builder: (context) => VerifyEmailDialog(email: email),
      );

      if (isVerified == true && mounted) {
        Navigator.pushNamed(context, '/reset-password', arguments: email);
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(auth.error ?? "Gửi mail thất bại"),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}
