import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path/path.dart' as path_lib;


class EditProfileModal extends StatefulWidget {
  final String currentUsername;
  final String currentPhotoUrl;
  final Future<void> Function(String, File?, String?) onSave; // Thêm File? parameter

  const EditProfileModal({
    super.key,
    required this.currentUsername,
    required this.currentPhotoUrl,
    required this.onSave,
  });

  @override
  State<EditProfileModal> createState() => _EditProfileModalState();
}

class _EditProfileModalState extends State<EditProfileModal> {
  late TextEditingController _usernameController;
  late TextEditingController _imageUrlController;
  bool _isLoading = false;
  File? _selectedImageFile;
  String? _selectedImageUrl;
  
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _usernameController = TextEditingController(text: widget.currentUsername);
    _imageUrlController = TextEditingController(text: widget.currentPhotoUrl);
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _imageUrlController.dispose();
    super.dispose();
  }

  Future<void> _pickImageFromGallery() async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 85,
      );
      
      if (image != null) {
        setState(() {
          _selectedImageFile = File(image.path);
          _selectedImageUrl = null;
          _imageUrlController.clear(); // Clear URL field nếu chọn file
        });
      }
    } catch (e) {
      debugPrint('Error picking image: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi chọn ảnh: $e')),
        );
      }
    }
  }

  Future<void> _takePhoto() async {
    try {
      final XFile? photo = await _picker.pickImage(
        source: ImageSource.camera,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 85,
      );
      
      if (photo != null) {
        setState(() {
          _selectedImageFile = File(photo.path);
          _selectedImageUrl = null;
          _imageUrlController.clear();
        });
      }
    } catch (e) {
      debugPrint('Error taking photo: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi chụp ảnh: $e')),
        );
      }
    }
  }

  void _removeSelectedImage() {
    setState(() {
      _selectedImageFile = null;
      _selectedImageUrl = null;
      _imageUrlController.clear();
    });
  }

  Future<void> _handleSave() async {
    final newUsername = _usernameController.text.trim();
    final newImageUrl = _imageUrlController.text.trim();

    // Validate username
    if (newUsername.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Tên người dùng không được để trống')),
        );
      }
      return;
    }

    // Check if anything changed
    final hasUsernameChanged = newUsername != widget.currentUsername;
    final hasImageChanged = _selectedImageFile != null || 
                           (newImageUrl.isNotEmpty && newImageUrl != widget.currentPhotoUrl) ||
                           (newImageUrl.isEmpty && widget.currentPhotoUrl.isNotEmpty);
    
    if (!hasUsernameChanged && !hasImageChanged) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Không có thay đổi để lưu')),
        );
        Navigator.pop(context);
      }
      return;
    }

    setState(() => _isLoading = true);

    try {
      // ✅ Gửi cả file và URL (chỉ 1 trong 2 sẽ được dùng)
      await widget.onSave(
        newUsername, 
        _selectedImageFile, // File ảnh từ thiết bị
        newImageUrl.isNotEmpty ? newImageUrl : null, // URL ảnh
      );
      
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Cập nhật thông tin thành công')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi: ${e.toString().replaceFirst("Exception: ", "")}'),
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
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Chỉnh sửa thông tin',
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
              
              // Username field
              TextFormField(
                controller: _usernameController,
                decoration: const InputDecoration(
                  labelText: 'Tên người dùng *',
                  border: OutlineInputBorder(),
                  hintText: 'Nhập tên người dùng',
                ),
                readOnly: _isLoading,
              ),
              const SizedBox(height: 20),
              
              // Ảnh đại diện section
              const Text(
                'Ảnh đại diện',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 12),
              
              // Image preview và selection
              Card(
                elevation: 2,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      // Current image preview
                      if (widget.currentPhotoUrl.isNotEmpty && 
                          _selectedImageFile == null && 
                          _imageUrlController.text.isEmpty)
                        Column(
                          children: [
                            const Text(
                              'Ảnh hiện tại:',
                              style: TextStyle(color: Colors.grey, fontSize: 14),
                            ),
                            const SizedBox(height: 8),
                            CircleAvatar(
                              radius: 40,
                              backgroundImage: NetworkImage(widget.currentPhotoUrl),
                              backgroundColor: Colors.grey[200],
                            ),
                            const SizedBox(height: 8),
                          ],
                        ),
                      
                      // Selected image file preview
                      if (_selectedImageFile != null)
                        Column(
                          children: [
                            const Text(
                              'Ảnh mới:',
                              style: TextStyle(color: Colors.green, fontSize: 14),
                            ),
                            const SizedBox(height: 8),
                            Stack(
                              children: [
                                CircleAvatar(
                                  radius: 40,
                                  backgroundImage: FileImage(_selectedImageFile!),
                                  backgroundColor: Colors.grey[200],
                                ),
                                Positioned(
                                  top: 0,
                                  right: 0,
                                  child: GestureDetector(
                                    onTap: _removeSelectedImage,
                                    child: Container(
                                      decoration: const BoxDecoration(
                                        color: Colors.red,
                                        shape: BoxShape.circle,
                                      ),
                                      padding: const EdgeInsets.all(4),
                                      child: const Icon(
                                        Icons.close,
                                        size: 16,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              path_lib.basename(_selectedImageFile!.path),
                              style: const TextStyle(fontSize: 12, color: Colors.grey),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      
                      // URL image preview
                      if (_imageUrlController.text.isNotEmpty && _selectedImageFile == null)
                        Column(
                          children: [
                            const Text(
                              'URL ảnh:',
                              style: TextStyle(color: Colors.blue, fontSize: 14),
                            ),
                            const SizedBox(height: 8),
                            CircleAvatar(
                              radius: 40,
                              backgroundImage: NetworkImage(_imageUrlController.text),
                              backgroundColor: Colors.grey[200],
                              onBackgroundImageError: (exception, stackTrace) {
                                if (mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Không thể tải ảnh từ URL này')),
                                  );
                                }
                              },
                            ),
                          ],
                        ),
                      
                      const SizedBox(height: 16),
                      
                      // Image selection buttons
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: _isLoading ? null : _pickImageFromGallery,
                              icon: const Icon(Icons.photo_library, size: 18),
                              label: const Text('Thư viện'),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 12),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: _isLoading ? null : _takePhoto,
                              icon: const Icon(Icons.camera_alt, size: 18),
                              label: const Text('Chụp ảnh'),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 12),
                              ),
                            ),
                          ),
                        ],
                      ),
                      
                      const SizedBox(height: 12),
                      
                      // Hoặc nhập URL
                      TextFormField(
                        controller: _imageUrlController,
                        decoration: InputDecoration(
                          labelText: 'Hoặc nhập URL ảnh',
                          border: const OutlineInputBorder(),
                          hintText: 'https://example.com/avatar.jpg',
                          suffixIcon: _imageUrlController.text.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(Icons.clear, size: 18),
                                  onPressed: _isLoading 
                                      ? null 
                                      : () {
                                          _imageUrlController.clear();
                                          setState(() {});
                                        },
                                )
                              : null,
                        ),
                        readOnly: _isLoading,
                        onChanged: (value) {
                          if (value.isNotEmpty && _selectedImageFile != null) {
                            setState(() {
                              _selectedImageFile = null;
                            });
                          }
                        },
                      ),
                    ],
                  ),
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Save button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _handleSave,
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
                          'Lưu thay đổi',
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
    );
  }
}