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

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text("Đặt lại mật khẩu"),
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
                const Text("Đặt lại mật khẩu",
                    style: TextStyle(
                      color: Color(0xFF396A30),
                      fontSize: 40, 
                      fontFamily: 'Unbounded',
                      fontWeight: FontWeight.w600,
                      )),
                const SizedBox(height: 20),

                const Text("Hãy điền mật khẩu bạn muốn sử dụng ở dưới!",
                    style: TextStyle(
                      color: Colors.black,
                      fontSize: 16, 
                      fontFamily: 'Nunito',
                      fontWeight: FontWeight.w300,
                      )),
                const SizedBox(height: 20),

                CustomTextField(
                  controller: _passwordController,
                  label: "Nhập mật khẩu mới",
                  validator: Validators.validatePassword,
                ),
                const SizedBox(height: 20),

                CustomTextField(
                  controller: _passwordController,
                  label: "Xác nhận mật khẩu mới",
                  validator: Validators.validatePassword,
                ),
                const SizedBox(height: 20),

                // Nút gửi password
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

                      final password = _passwordController.text;
                      // Xử lý logic đặt lại mật khẩu ở đây 
                      //final success = await auth.changePassword(password);

                      showDialog(
                        context: context,
                        builder: (context) => const ReturnLoginDialog(
                          title: "Đặt lại mật khẩu thành công",
                          message: "Mật khẩu của bạn đã được đặt lại thành công. Vui lòng đăng nhập lại với mật khẩu mới.",
                        ),
                      );
                    },
                    child: const Text(
                      "Xác nhận",
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),

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