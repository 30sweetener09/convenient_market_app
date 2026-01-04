// image_picker_widget.dart
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path/path.dart' as path_lib;

class ImagePickerWidget extends StatefulWidget {
  final String? currentImageUrl;
  final String? title;
  final Function(File? selectedFile) onImageChanged;

  const ImagePickerWidget({
    super.key,
    this.currentImageUrl,
    this.title,
    required this.onImageChanged,
  });

  @override
  State<ImagePickerWidget> createState() => _ImagePickerWidgetState();
}

class _ImagePickerWidgetState extends State<ImagePickerWidget> {
  File? _selectedImageFile;
  final ImagePicker _picker = ImagePicker();

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
        });
        widget.onImageChanged(_selectedImageFile);
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
        });
        widget.onImageChanged(_selectedImageFile);
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
    });
    widget.onImageChanged(null);
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title
            if (widget.title != null) ...[
              Text(
                widget.title!,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 12),
            ],
            
            // Image preview section
            Column(
              children: [
                // Current image preview
                if (widget.currentImageUrl != null && 
                    widget.currentImageUrl!.isNotEmpty && 
                    _selectedImageFile == null)
                  Column(
                    children: [
                      const Text(
                        'Ảnh hiện tại:',
                        style: TextStyle(color: Colors.grey, fontSize: 14),
                      ),
                      const SizedBox(height: 8),
                      CircleAvatar(
                        radius: 40,
                        backgroundImage: NetworkImage(widget.currentImageUrl!),
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
                
                // If no image at all
                if ((widget.currentImageUrl == null || widget.currentImageUrl!.isEmpty) && 
                    _selectedImageFile == null)
                  Column(
                    children: [
                      CircleAvatar(
                        radius: 40,
                        backgroundColor: Colors.grey[200],
                        child: Icon(
                          Icons.image,
                          size: 32,
                          color: Colors.grey[400],
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Chưa có ảnh nào được chọn',
                        style: TextStyle(color: Colors.grey, fontSize: 14),
                      ),
                    ],
                  ),
              ],
            ),
            
            const SizedBox(height: 16),
            
            // Image selection buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _pickImageFromGallery,
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
                    onPressed: _takePhoto,
                    icon: const Icon(Icons.camera_alt, size: 18),
                    label: const Text('Chụp ảnh'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}