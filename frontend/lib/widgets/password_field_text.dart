import 'package:flutter/material.dart';

class PasswordTextField extends StatefulWidget {
  final TextEditingController controller;
  final String label;
  final String? Function(String?)? validator;
  final bool confirmPassword; // Cho field xác nhận mật khẩu
  final TextEditingController? originalPasswordController; // Controller của mật khẩu gốc

  const PasswordTextField({
    super.key,
    required this.controller,
    required this.label,
    this.validator,
    this.confirmPassword = false,
    this.originalPasswordController,
  });

  @override
  State<PasswordTextField> createState() => _PasswordTextFieldState();
}

class _PasswordTextFieldState extends State<PasswordTextField> {
  bool _obscureText = true;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: widget.controller,
      obscureText: _obscureText,
      validator: widget.confirmPassword
          ? (value) {
              if (value == null || value.isEmpty) {
                return "Vui lòng xác nhận mật khẩu";
              }
              if (widget.originalPasswordController != null &&
                  value != widget.originalPasswordController!.text) {
                return "Mật khẩu không khớp";
              }
              // Nếu có validator riêng
              if (widget.validator != null) {
                return widget.validator!(value);
              }
              return null;
            }
          : widget.validator,
      decoration: InputDecoration(
        labelText: widget.label,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(20)),
        suffixIcon: IconButton(
          icon: Icon(
            _obscureText ? Icons.visibility : Icons.visibility_off,
            color: Colors.grey,
          ),
          onPressed: () {
            setState(() {
              _obscureText = !_obscureText;
            });
          },
        ),
      ),
    );
  }
}