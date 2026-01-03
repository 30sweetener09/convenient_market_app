import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../data/models/food_model.dart';
import '../../providers/food_provider.dart';

class FoodFormDialog extends StatefulWidget {
  final Food? food; // null = create, != null = edit

  const FoodFormDialog({super.key, this.food});

  @override
  State<FoodFormDialog> createState() => _FoodFormDialogState();
}

class _FoodFormDialogState extends State<FoodFormDialog> {
  final _nameCtrl = TextEditingController();

  String? _selectedType;
  String? _selectedUnit;
  String? _selectedCategory;

  File? _imageFile;

  final List<String> _types = ['Ingredient', 'Meal'];

  @override
  void initState() {
    super.initState();

    // fetch dropdown data
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<FoodProvider>();
      provider.fetchUnits();
      provider.fetchCategories();
    });

    // load edit data
    if (widget.food != null) {
      final f = widget.food!;
      _nameCtrl.text = f.name;
      _selectedType = f.type;
      _selectedUnit = f.unit;
      _selectedCategory = f.category;
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery);
    if (picked != null) {
      setState(() => _imageFile = File(picked.path));
    }
  }

  Future<void> _submit() async {
    debugPrint("name=${_nameCtrl.text}");
    debugPrint("type=$_selectedType");
    debugPrint("unit=$_selectedUnit");
    debugPrint("category=$_selectedCategory");

    if (_nameCtrl.text.trim().isEmpty ||
        _selectedType == null ||
        _selectedUnit == null ||
        _selectedCategory == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Vui lòng nhập đầy đủ thông tin")),
      );
      return;
    }

    final provider = context.read<FoodProvider>();
    bool success;

    if (widget.food == null) {
      // CREATE
      success = await provider.createFood(
        name: _nameCtrl.text.trim(),
        type: _selectedType!,
        unitName: _selectedUnit!,
        foodCategoryName: _selectedCategory!,
        imageFile: _imageFile,
      );
    } else {
      // UPDATE
      success = await provider.updateFood(
        id: widget.food!.id,
        name: _nameCtrl.text.trim(),
        type: _selectedType!,
        unitName: _selectedUnit!,
        foodCategoryName: _selectedCategory!,
        imageFile: _imageFile,
      );
    }

    if (success && mounted) {
      Navigator.pop(context, true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Thao tác thất bại")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<FoodProvider>();

    return Dialog(
      insetPadding: const EdgeInsets.all(16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              widget.food == null ? "Thêm thực phẩm" : "Chỉnh sửa thực phẩm",
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),

            const SizedBox(height: 16),

            _buildTextField("Tên sản phẩm", _nameCtrl),

            _buildDropdown(
              label: "Loại",
              value: _selectedType,
              items: _types,
              onChanged: (v) => setState(() => _selectedType = v),
            ),

            _buildDropdown(
              label: "Đơn vị",
              value: _selectedUnit,
              items: provider.units,
              onChanged: (v) => setState(() => _selectedUnit = v),
            ),

            _buildDropdown(
              label: "Danh mục",
              value: _selectedCategory,
              items: provider.categories,
              onChanged: (v) => setState(() => _selectedCategory = v),
            ),

            const SizedBox(height: 12),

            // IMAGE PICKER
            Row(
              children: [
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade300),
                  ),
                  child: _imageFile == null
                      ? const Icon(Icons.image, size: 32)
                      : ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.file(_imageFile!, fit: BoxFit.cover),
                  ),
                ),
                const SizedBox(width: 12),
                ElevatedButton.icon(
                  onPressed: _pickImage,
                  icon: const Icon(Icons.upload),
                  label: const Text("Tải ảnh"),
                ),
              ],
            ),

            const SizedBox(height: 20),

            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF386633),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    onPressed: _submit,
                    child: const Text(
                      "Xác nhận",
                      style: TextStyle(color: Colors.white),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text("Hủy", style: TextStyle(color: Colors.red)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ================= WIDGETS =================

  Widget _buildTextField(String label, TextEditingController ctrl) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: ctrl,
        decoration: _inputDecoration(label),
      ),
    );
  }

  Widget _buildDropdown({
    required String label,
    required String? value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
  }) {
    final safeValue = items.contains(value) ? value : null;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: DropdownButtonFormField<String>(
        value: safeValue,
        isExpanded: true,
        items: items
            .map(
              (e) => DropdownMenuItem(
            value: e,
            child: Text(e),
          ),
        )
            .toList(),
        onChanged: onChanged,
        decoration: _inputDecoration(label),
      ),
    );
  }

  InputDecoration _inputDecoration(String label) {
    return InputDecoration(
      labelText: label,
      filled: true,
      fillColor: Colors.grey.shade50,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Color(0xFF386633), width: 1.5),
      ),
    );
  }
}
