import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/user_provider.dart';

class ProfileModal extends StatefulWidget {
  const ProfileModal({super.key});

  @override
  State<ProfileModal> createState() => _ProfileModalState();
}

class _ProfileModalState extends State<ProfileModal> {
  final _usernameCtrl = TextEditingController();
  String? _photoUrl;

  @override
void didChangeDependencies() {
  super.didChangeDependencies();

  final user = context.read<UserProvider>().user;
  if (user != null) {
    _usernameCtrl.text = user.username;
    _photoUrl = user.photoUrl;
  }
}

  @override
  void dispose() {
    _usernameCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<UserProvider>().user;

    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            'Thông tin cá nhân',
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),

          _avatar(),
          const SizedBox(height: 16),

          _usernameField(), 
          _readonlyField('Họ tên', user?.name),
          _readonlyField('Ngày sinh', user?.birthdate),
          _readonlyField('Giới tính', user?.gender),
          _readonlyField('Email', user?.email),

          const SizedBox(height: 24),
          _actions(),
        ],
      ),
    );
  }

  Widget _actions() {
    final provider = context.watch<UserProvider>();
    final user = provider.user;

  final isChanged =
      user != null &&
      (_usernameCtrl.text.trim() != user.username ||
       _photoUrl != user.photoUrl);

    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Huỷ'),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: ElevatedButton(
            onPressed: (!isChanged || provider.isLoading)
              ? null
              : () async {
                  await provider.updateUserInfo(
                    username: _usernameCtrl.text.trim(),
                    photoUrl: _photoUrl,
                  );

                  if (!mounted) return;
                  Navigator.pop(context);
                },
            child: const Text('Lưu'),
          ),
        ),
      ],
    );
  }

  Widget _readonlyField(String label, String? value) {
    return TextField(
      enabled: false,
      decoration: InputDecoration(labelText: label, hintText: value ?? ''),
    );
  }

  Widget _usernameField() {
    return TextField(
      controller: _usernameCtrl,
      decoration: const InputDecoration(labelText: 'Tên người dùng'),
    );
  }

  Widget _avatar() {
    return Stack(
      children: [
        CircleAvatar(
          radius: 40,
          backgroundColor: const Color(0xFF4F6F3A),
          backgroundImage: (_photoUrl != null && _photoUrl!.isNotEmpty)
        ? NetworkImage(_photoUrl!)
        : null,
          child: (_photoUrl == null || _photoUrl!.isEmpty)
            ? const Icon(Icons.person, color: Colors.white, size: 32)
            : null,
        ),
        Positioned(
          bottom: 0,
          right: 0,
          child: InkWell(
            onTap: _changePhotoUrl,
            child: const CircleAvatar(
              radius: 14,
              backgroundColor: Colors.white,
              child: Icon(Icons.edit, size: 16),
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _changePhotoUrl() async {
    final controller = TextEditingController(text: _photoUrl);

    final result = await showDialog<String>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Ảnh đại diện (URL)'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(hintText: 'https://...'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Huỷ'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, controller.text.trim()),
            child: const Text('Lưu'),
          ),
        ],
      ),
    );

    if (result != null && result.isNotEmpty) {
      setState(() => _photoUrl = result);
    }
  }
}
