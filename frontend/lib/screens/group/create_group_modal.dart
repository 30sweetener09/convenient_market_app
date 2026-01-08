// create_group_modal.dart
import 'dart:io';
import 'package:di_cho_tien_loi/providers/fridge_provider.dart';
import 'package:di_cho_tien_loi/providers/group_provider.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../widgets/image_picker.dart';

class CreateGroupModal extends StatefulWidget {
  const CreateGroupModal({super.key});

  @override
  State<CreateGroupModal> createState() => _CreateGroupModalState();
}

class _CreateGroupModalState extends State<CreateGroupModal> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  File? _selectedImageFile;
  bool _isLoading = false;

  Future<void> _createDefaultFridges({
    required int groupId,
    required FridgeProvider fridgeProvider,
  }) async {
    const defaultFridges = ['Khác', 'Ngăn đông', 'Ngăn mát'];
    const defaultBio = [
      'Chứa thực phẩm khác',
      'Chứa thực phẩm cần bảo quản đông',
      'Chứa thực phẩm, đồ ăn bảo quản ngắn ngày',
    ];

    for (int i = 0; i < defaultFridges.length; i++) {
      await fridgeProvider.createFridge(
        name: defaultFridges[i],
        groupId: groupId,
        description: defaultBio[i],
      );
    }
  }

  Future<void> _createGroup() async {
    debugPrint('=== BẮT ĐẦU TẠO NHÓM ===');
    debugPrint('Tên: ${_nameController.text}');
    debugPrint('Mô tả: ${_descriptionController.text}');
    debugPrint('Ảnh: ${_selectedImageFile?.path}');
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final groupProvider = context.read<GroupProvider>();
      final fridgeProvider = context.read<FridgeProvider>();
      final newGroup = await groupProvider.createGroup(
        name: _nameController.text.trim(),
        description: _descriptionController.text.trim(),
        imageFile: _selectedImageFile,
      );
      final groupId = int.parse(newGroup.id);
      await _createDefaultFridges(
        groupId: groupId,
        fridgeProvider: fridgeProvider,
      );

      if (mounted) {
        Navigator.pop(context, true); // TRẢ VỀ true KHI TẠO THÀNH CÔNG
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Tạo nhóm thành công!')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Lỗi: ${e.toString().replaceFirst("Exception: ", "")}',
            ),
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        padding: const EdgeInsets.all(24),
        child: SingleChildScrollView(
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Tạo nhóm mới',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    IconButton(
                      onPressed: _isLoading
                          ? null
                          : () => Navigator.pop(context),
                      icon: const Icon(Icons.close),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Tên nhóm
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    labelText: 'Tên nhóm *',
                    border: OutlineInputBorder(),
                    hintText: 'Nhập tên nhóm',
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Vui lòng nhập tên nhóm';
                    }
                    if (value.trim().length < 3) {
                      return 'Tên nhóm phải có ít nhất 3 ký tự';
                    }
                    return null;
                  },
                  autovalidateMode: AutovalidateMode.onUserInteraction,
                  textInputAction: TextInputAction.next,
                  readOnly: _isLoading,
                ),
                const SizedBox(height: 16),

                // Mô tả
                TextFormField(
                  controller: _descriptionController,
                  decoration: const InputDecoration(
                    labelText: 'Mô tả',
                    border: OutlineInputBorder(),
                    hintText: 'Nhập mô tả cho nhóm',
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Vui lòng nhập mô tả';
                    }
                    if (value.trim().length < 10) {
                      return 'Mô tả phải có ít nhất 10 ký tự';
                    }
                    return null;
                  },
                  autovalidateMode: AutovalidateMode.onUserInteraction,
                  maxLines: 2,
                  readOnly: _isLoading,
                ),
                const SizedBox(height: 20),

                //Ảnh đại diện nhóm
                ImagePickerWidget(
                  title: 'Ảnh đại diện nhóm (tùy chọn)',
                  onImageChanged: (File? selectedFile) {
                    setState(() {
                      _selectedImageFile = selectedFile;
                    });
                  },
                ),

                const SizedBox(height: 24),

                // Nút tạo
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _createGroup,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      backgroundColor: Theme.of(context).primaryColor,
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            height: 24,
                            width: 24,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text(
                            'Tạo nhóm',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                  ),
                ),

                // Cancel button
                if (!_isLoading) ...[
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Hủy'),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }
}
