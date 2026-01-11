import 'package:di_cho_tien_loi/providers/user_provider.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class ChangePasswordModal extends StatefulWidget {
  const ChangePasswordModal({super.key});

  @override
  State<ChangePasswordModal> createState() => _ChangePasswordModalState();
}

class _ChangePasswordModalState extends State<ChangePasswordModal> {
  final _formKey = GlobalKey<FormState>();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final provider = context.read<UserProvider>();

    await provider.changePassword(_newPasswordController.text.trim());

    if (provider.error == null && mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Đổi mật khẩu thành công')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<UserProvider>(
      builder: (context, provider, _) {
        return Padding(
          padding: EdgeInsets.only(
            left: 16,
            right: 16,
            top: 16,
            bottom: MediaQuery.of(context).viewInsets.bottom + 16,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Đổi mật khẩu',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 16),

              Form(
                key: _formKey,
                child: Column(
                  children: [
                    TextFormField(
                      controller: _newPasswordController,
                      obscureText: _obscure,
                      decoration: InputDecoration(
                        labelText: 'Mật khẩu mới',
                        prefixIcon: const Icon(Icons.lock_outline),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscure ? Icons.visibility_off : Icons.visibility,
                          ),
                          onPressed: () => setState(() => _obscure = !_obscure),
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Không được để trống';
                        }
                        if (value.length < 6) {
                          return 'Ít nhất 6 ký tự';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),

                    TextFormField(
                      controller: _confirmPasswordController,
                      obscureText: _obscure,
                      decoration: const InputDecoration(
                        labelText: 'Xác nhận mật khẩu',
                        prefixIcon: Icon(Icons.lock),
                      ),
                      validator: (value) {
                        if (value != _newPasswordController.text) {
                          return 'Mật khẩu không khớp';
                        }
                        return null;
                      },
                    ),
                  ],
                ),
              ),

              if (provider.error != null) ...[
                const SizedBox(height: 8),
                Text(
                  "Đổi mật khẩu thất bại: Lỗi hệ thống hoặc token của bạn đã hết hạn: ${provider.error!}",
                  style: const TextStyle(color: Colors.red, fontSize: 13),
                ),
              ],

              const SizedBox(height: 20),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF396A30), // Màu nền
                    foregroundColor: Colors.white, // Màu chữ
                    textStyle: const TextStyle(fontSize: 20, fontFamily: 'Nunito', fontWeight: FontWeight.w600),
                    padding: const EdgeInsets.symmetric(
                      vertical: 16,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20), // Bo góc
                    ),
                  ),
                  onPressed: provider.isLoading ? null : _submit,
                  child: provider.isLoading
                      ? const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Xác nhận'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
