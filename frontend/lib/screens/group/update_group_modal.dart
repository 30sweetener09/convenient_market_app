import 'dart:io';
import 'package:di_cho_tien_loi/providers/group_provider.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../widgets/image_picker.dart';

class UpdateGroupModal extends StatefulWidget {
  final String groupId;
  final String currentName;
  final String currentDescription;
  final String? currentImageUrl;

  const UpdateGroupModal({
    super.key,
    required this.groupId,
    required this.currentName,
    required this.currentDescription,
    this.currentImageUrl,
  });

  @override
  State<UpdateGroupModal> createState() => _UpdateGroupModalState();
}

class _UpdateGroupModalState extends State<UpdateGroupModal> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _descriptionController;
  File? _selectedImageFile;
  bool _isLoading = false;
  bool _imageChanged = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.currentName);
    _descriptionController = TextEditingController(text: widget.currentDescription);
  }

  Future<void> _updateGroup() async {
    debugPrint('=== BẮT ĐẦU CẬP NHẬT NHÓM ===');
    debugPrint('ID: ${widget.groupId}');
    debugPrint('Tên mới: ${_nameController.text}');
    debugPrint('Mô tả mới: ${_descriptionController.text}');
    debugPrint('Ảnh thay đổi: ${_imageChanged}');
    
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isLoading = true);
    
    try {
      final groupProvider = context.read<GroupProvider>();
      
      // Chỉ gửi ảnh nếu có thay đổi
      File? imageFileToSend = _imageChanged ? _selectedImageFile : null;
      
      final updatedGroup = await groupProvider.updateGroup(
        id: widget.groupId,
        name: _nameController.text.trim(),
        description: _descriptionController.text.trim(),
        imageFile: imageFileToSend,
      );
      
      if (mounted) {
        Navigator.pop(context, updatedGroup); // Trả về group đã update
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Cập nhật nhóm thành công!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi: ${e.toString().replaceFirst("Exception: ", "")}'),
            backgroundColor: Colors.red,
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
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
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
                      'Cập nhật nhóm',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    IconButton(
                      onPressed: _isLoading ? null : () => Navigator.pop(context),
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
                    labelText: 'Mô tả *',
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
                  maxLines: 3,
                  readOnly: _isLoading,
                ),
                const SizedBox(height: 20),
                
                // Hiển thị ảnh hiện tại
                if (widget.currentImageUrl != null && widget.currentImageUrl!.isNotEmpty)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Ảnh hiện tại:',
                        style: TextStyle(
                          fontWeight: FontWeight.w500,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Center(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.network(
                            widget.currentImageUrl!,
                            width: 120,
                            height: 120,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return Container(
                                width: 120,
                                height: 120,
                                decoration: BoxDecoration(
                                  color: Colors.grey[200],
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Icon(
                                  Icons.group,
                                  size: 60,
                                  color: Colors.grey,
                                ),
                              );
                            },
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                  ),
                
                //Ảnh đại diện nhóm mới
                ImagePickerWidget(
                  title: 'Thay đổi ảnh đại diện (tùy chọn)',
                  onImageChanged: (File? selectedFile) {
                    setState(() {
                      _selectedImageFile = selectedFile;
                      _imageChanged = true;
                    });
                  },
                ),
                
                const SizedBox(height: 24),
                
                // Nút cập nhật
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _updateGroup,
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
                            'Cập nhật',
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