import 'package:flutter/material.dart';
import '../../data/models/recipe_model.dart';

class RecipeFormScreen extends StatefulWidget {
  final Recipe? recipe; // null = thêm mới, có = sửa

  const RecipeFormScreen({super.key, this.recipe});

  @override
  State<RecipeFormScreen> createState() => _RecipeFormScreenState();
}

class _RecipeFormScreenState extends State<RecipeFormScreen> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _titleCtrl;
  late TextEditingController _descCtrl;

  @override
  void initState() {
    super.initState();
    _titleCtrl = TextEditingController(text: widget.recipe?.title ?? "");
    _descCtrl = TextEditingController(text: widget.recipe?.description ?? "");
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;

    final newRecipe = Recipe(
      id: widget.recipe?.id ?? DateTime.now().toString(),
      title: _titleCtrl.text,
      description: _descCtrl.text,
      image: widget.recipe?.image ?? "assets/images/default.png",
    );

    // TODO: gọi Provider / API
    Navigator.pop(context, newRecipe);
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.recipe != null;

    return Scaffold(
      appBar: AppBar(
        title: Text(isEdit ? "Sửa món ăn" : "Thêm món ăn"),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                controller: _titleCtrl,
                decoration: const InputDecoration(
                  labelText: "Tên món ăn",
                  border: OutlineInputBorder(),
                ),
                validator: (v) =>
                v == null || v.isEmpty ? "Không được để trống" : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _descCtrl,
                maxLines: 4,
                decoration: const InputDecoration(
                  labelText: "Giới thiệu",
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _submit,
                  child: Text(isEdit ? "Cập nhật" : "Thêm mới"),
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}
