import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import './widgets/menu_item.dart';
import 'modals/logout_dialog.dart';
import 'modals/delete_acc_dialog.dart';
import 'modals/edit_profile_modal.dart';
import 'package:provider/provider.dart';
import '../../../providers/user_provider.dart';
import '../../../providers/auth_provider.dart';

class UserScreen extends StatefulWidget {
  const UserScreen({super.key});

  @override
  State<UserScreen> createState() => _UserScreenState();
}

class _UserScreenState extends State<UserScreen> {
  @override
  void initState() {
    super.initState();
    final provider = context.read<UserProvider>();
    if (provider.user == null) {
      provider.fetchUserInfo();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('User Screen')),
      body: _profileScreen(),
    );
  }

  Widget _profileScreen() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [_profileCard(), const SizedBox(height: 24), _menuList()],
      ),
    );
  }

  Widget _profileCard() {
    final userProvider = context.watch<UserProvider>();
    final user = userProvider.user;
    if (userProvider.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (user == null) {
      return Text(userProvider.error ?? 'Chưa đăng nhập');
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: const Color.fromARGB(21, 0, 0, 0), blurRadius: 10),
        ],
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              CircleAvatar(
                radius: 32,
                backgroundColor: const Color(0xFF4F6F3A),
                backgroundImage:
                    (user.photoUrl != null && user.photoUrl!.isNotEmpty)
                    ? NetworkImage(user.photoUrl!)
                    : null,
                child: (user.photoUrl == null || user.photoUrl!.isEmpty)
                    ? const Icon(Icons.person, color: Colors.white, size: 32)
                    : null,
              ),
              const SizedBox(width: 32),

              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user.username.isNotEmpty ? user.username : "Chưa có tên",
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      user.email.isNotEmpty
                          ? user.email
                          : "Không hiển thị được email",
                      style: const TextStyle(color: Colors.grey),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ]
          ),
          Divider(color: Colors.grey, thickness: 1,),
          ExpansionTile(
            title: const Text('Chi tiết'),
            tilePadding: EdgeInsets.zero,
            trailing: Icon(Icons.keyboard_arrow_down),
            childrenPadding: const EdgeInsets.only(top: 8),
            children: [
              _infoRow('Ngày sinh', user.birthdate),
              _infoRow('Giới tính', user.gender),
            ],
          ),
            
          
        ],
      ),
    );
  }

  Widget _menuList() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
      child: Column(
        children: [
          MenuItem(
            icon: Icons.person_outline,
            title: 'Sửa thông tin cá nhân',
            description: 'Thay đổi ảnh đại diện và tên',
            onTap: () {
              _showEditProfileModal();
            },
          ),
          MenuItem(
            icon: Icons.lock_outline,
            title: 'Đổi mật khẩu',
            description: 'Thay đổi mật khẩu để đăng nhập tài khoản',
            onTap: () {},
          ),
          MenuItem(
            icon: Icons.person_remove,
            title: 'Xoá tài khoản',
            description: 'Xoá tài khoản này ra khỏi hệ thống',
            color: Colors.red,
            onTap: () {
              final userProvider = context.read<UserProvider>();
              final authProvider = context.read<AuthProvider>();

              showDialog(
                context: context,
                builder: (_) => DeleteAccDialog(
                  onConfirmDelete: () async {
                    await userProvider.delete();
                    await authProvider.logout();
                  },
                ),
              );
            },
          ),
          MenuItem(
            icon: Icons.logout,
            title: 'Đăng xuất',
            color: Colors.red,
            description: 'Đăng xuất tài khoản này ở trên thiết bị này',
            onTap: () {
              final authProvider = context.read<AuthProvider>();
              showDialog(
                context: context,
                builder: (_) => LogoutDialog(
                  onConfirmLogout: () async {
                    authProvider.logout();
                  },
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Expanded(
            flex: 3,
            child: Text(
              '$label:',
              style: const TextStyle(color: Colors.grey, fontSize: 14),
            ),
          ),
          Expanded(
            flex: 5,
            child: Text(
              value.isNotEmpty ? value : 'Chưa cập nhật',
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }
   void _showEditProfileModal() {
    final userProvider = context.read<UserProvider>();
    final user = userProvider.user;
    
    if (user == null) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return EditProfileModal(
          currentUsername: user.username,
          currentPhotoUrl: user.photoUrl ?? '',
          onSave: (String newUsername, File? imageFile, String? imageUrl) async {
            // Gọi API cập nhật thông tin
            await userProvider.updateUserInfo(
              username: newUsername,
              
            imageFile: imageFile,
            imageUrl: imageUrl,
            );
            if (mounted) {
              setState(() {});
            }
          },
        );
      },
    );
  }
}
