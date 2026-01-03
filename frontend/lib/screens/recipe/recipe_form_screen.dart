import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../data/models/recipe_model.dart';
import '../../providers/recipe_provider.dart';
import '../../widgets/custom_header.dart';

class RecipeFormScreen extends StatefulWidget {
  final Recipe? recipe; // null = thêm mới, có = sửa

  const RecipeFormScreen({super.key, this.recipe});

  @override
  State<RecipeFormScreen> createState() => _RecipeFormScreenState();
}

class _RecipeFormScreenState extends State<RecipeFormScreen> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _foodNameCtrl;
  late TextEditingController _nameCtrl;
  late TextEditingController _descCtrl;
  late TextEditingController _ingredientCtrl;
  late TextEditingController _stepCtrl;
  late TextEditingController _imageUrlCtrl;

  File? _pickedImage;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();

    // _foodNameCtrl =
    //     TextEditingController(text: widget.recipe?.foodName ?? "");
    _nameCtrl = TextEditingController(text: widget.recipe?.name ?? "");
    _descCtrl = TextEditingController(text: widget.recipe?.description ?? "");
    _ingredientCtrl = TextEditingController();
    _stepCtrl = TextEditingController();
    _imageUrlCtrl = TextEditingController(text: widget.recipe?.image ?? "");
  }

  @override
  void dispose() {
    // _foodNameCtrl.dispose();
    _nameCtrl.dispose();
    _descCtrl.dispose();
    _ingredientCtrl.dispose();
    _stepCtrl.dispose();
    _imageUrlCtrl.dispose();
    super.dispose();
  }

  /// chọn ảnh từ máy
  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final result = await picker.pickImage(source: ImageSource.gallery);

    if (result != null) {
      setState(() {
        _pickedImage = File(result.path);
        _imageUrlCtrl.clear(); // ưu tiên ảnh local
      });
    }
  }

  /// Gộp nguyên liệu + cách làm thành HTML
  String _buildHtmlContent() {
    final ingredients = _ingredientCtrl.text
        .split('\n')
        .where((e) => e.trim().isNotEmpty)
        .map((e) => "<li>${e.trim()}</li>")
        .join();

    final steps = _stepCtrl.text
        .split('\n')
        .where((e) => e.trim().isNotEmpty)
        .map((e) => "<p>${e.trim()}</p>")
        .join();

    return """
<h2>Nguyên liệu</h2>
<ul>
$ingredients
</ul>

<h2>Cách làm</h2>
$steps
""";
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_submitting) return;

    setState(() => _submitting = true);

    final success = await context.read<RecipeProvider>().createRecipe(
      // foodName: _foodNameCtrl.text.trim(),
      name: _nameCtrl.text.trim(),
      description: _descCtrl.text.trim(),
      htmlContent: _buildHtmlContent(),
      image: _pickedImage,
    );

    if (!mounted) return;

    setState(() => _submitting = false);

    if (success) {
      Navigator.pop(context, true);
    } else {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("Tạo công thức thất bại")));
    }
  }

  Widget _buildImagePreview() {
    if (_pickedImage != null) {
      return Image.file(
        _pickedImage!,
        height: 180,
        width: double.infinity,
        fit: BoxFit.cover,
      );
    }

    if (_imageUrlCtrl.text.isNotEmpty) {
      return Image.network(
        _imageUrlCtrl.text,
        height: 180,
        width: double.infinity,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => const Text("Không tải được ảnh"),
      );
    }

    return Container(
      height: 180,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: Colors.grey.shade200,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade400),
      ),
      child: const Text("Chưa chọn ảnh"),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.recipe != null;

    return Scaffold(
      appBar: const CustomHeader(showBack: true),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              /// ẢNH
              _buildImagePreview(),
              const SizedBox(height: 12),

              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _pickImage,
                      icon: const Icon(Icons.photo),
                      label: const Text("Chọn ảnh"),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              const SizedBox(height: 16),

              /// TÊN MÓN
              // TextFormField(
              //   controller: _foodNameCtrl,
              //   decoration: const InputDecoration(
              //     labelText: "Tên món ăn",
              //     border: OutlineInputBorder(),
              //   ),
              //   validator: (v) =>
              //   v == null || v.isEmpty ? "Không được để trống" : null,
              // ),
              const SizedBox(height: 16),

              /// TÊN CÔNG THỨC
              TextFormField(
                controller: _nameCtrl,
                decoration: const InputDecoration(
                  labelText: "Tên công thức",
                  border: OutlineInputBorder(),
                ),
                validator: (v) =>
                    v == null || v.isEmpty ? "Không được để trống" : null,
              ),

              const SizedBox(height: 16),

              /// MÔ TẢ
              TextFormField(
                controller: _descCtrl,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: "Mô tả ngắn",
                  border: OutlineInputBorder(),
                ),
              ),

              const SizedBox(height: 16),

              /// NGUYÊN LIỆU
              TextFormField(
                controller: _ingredientCtrl,
                maxLines: 6,
                decoration: const InputDecoration(
                  labelText: "Nguyên liệu",
                  border: OutlineInputBorder(),
                ),
                validator: (v) =>
                    v == null || v.isEmpty ? "Không được để trống" : null,
              ),

              const SizedBox(height: 16),

              /// CÁCH LÀM
              TextFormField(
                controller: _stepCtrl,
                maxLines: 8,
                decoration: const InputDecoration(
                  labelText: "Cách làm",
                  border: OutlineInputBorder(),
                ),
                validator: (v) =>
                    v == null || v.isEmpty ? "Không được để trống" : null,
              ),

              const SizedBox(height: 24),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _submitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF386633),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: _submitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Text(
                          isEdit ? "Cập nhật" : "Thêm mới",
                          style: const TextStyle(
                            fontSize: 16,
                            color: Colors.white,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
