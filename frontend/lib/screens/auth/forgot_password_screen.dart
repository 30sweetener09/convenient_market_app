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
<<<<<<< HEAD
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
=======
>>>>>>> 6134029d30e5bea7d87cb744d077754cb39bf252
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              // crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
<<<<<<< HEAD
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
=======
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
>>>>>>> 6134029d30e5bea7d87cb744d077754cb39bf252

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
<<<<<<< HEAD
                      backgroundColor: Color(0xFF396A30),
=======
                      backgroundColor: Colors.green,
>>>>>>> 6134029d30e5bea7d87cb744d077754cb39bf252
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
<<<<<<< HEAD
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
=======
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
>>>>>>> 6134029d30e5bea7d87cb744d077754cb39bf252
                      ),
                    ),
                  ),
                ),
<<<<<<< HEAD
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
=======
>>>>>>> 6134029d30e5bea7d87cb744d077754cb39bf252
              ],
            ),
          ),
        ),
      ),
    );
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> 6134029d30e5bea7d87cb744d077754cb39bf252
