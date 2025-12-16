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
                const Text("Quên mật khẩu",
                    style: TextStyle(
                      color: Color(0xFF396A30),
                      fontSize: 36, 
                      fontFamily: 'Unbounded',
                      fontWeight: FontWeight.w600,
                      )),
                const SizedBox(height: 20),

                const Text("Hãy nhập email bạn đã sử dụng. Ứng dụng sẽ gửi một mã code đến gmail của bạn để thay đổi mật khẩu.",
                    style: TextStyle(
                      color: Colors.black,
                      fontSize: 16, 
                      fontFamily: 'Nunito',
                      fontWeight: FontWeight.w300,
                      )),
                const SizedBox(height: 20),

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
                      backgroundColor: Color(0xFF396A30),
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
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
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
}