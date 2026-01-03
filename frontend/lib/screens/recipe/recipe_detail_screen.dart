import 'package:flutter/material.dart';
import 'package:flutter_html/flutter_html.dart';
import 'package:provider/provider.dart';

import '../../data/models/recipe_model.dart';
import '../../providers/recipe_provider.dart';
import '../../widgets/custom_bottom_nav.dart';
import '../../widgets/custom_header.dart';
import '../recipe/recipe_form_screen.dart';

class RecipeDetailScreen extends StatelessWidget {
  final Recipe recipe;

  const RecipeDetailScreen({super.key, required this.recipe});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: CustomHeader(
        showBack: true,
        onEdit: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => RecipeFormScreen(recipe: recipe),
            ),
          );

          // cập nhật thành công → quay lại list
          if (result == true && context.mounted) {
            Navigator.pop(context, true);
          }
        },
        onDelete: () => _confirmDelete(context),
      ),
      bottomNavigationBar: CustomBottomNav(
        currentIndex: 1,
        onTap: (_) {},
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            /// ẢNH
            if (recipe.image.isNotEmpty)
              Image.network(
                recipe.image,
                width: double.infinity,
                height: 220,
                fit: BoxFit.cover,
              ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  /// TÊN
                  Text(
                    recipe.name,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 16),

                  /// MÔ TẢ
                  Text(
                    recipe.description,
                    style: const TextStyle(fontSize: 15),
                  ),

                  const SizedBox(height: 20),

                  /// HTML CONTENT
                  Html(
                    data: recipe.htmlContent,
                    style: {
                      "h2": Style(
                        fontSize: FontSize(18),
                        fontWeight: FontWeight.bold,
                        margin: Margins.only(bottom: 8, top: 16),
                      ),
                      "p": Style(
                        fontSize: FontSize(15),
                        margin: Margins.only(bottom: 8),
                      ),
                      "li": Style(
                        fontSize: FontSize(15),
                        margin: Margins.only(bottom: 6),
                      ),
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ================= CONFIRM DELETE =================
  void _confirmDelete(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text("Xóa công thức"),
        content: const Text("Bạn có chắc muốn xóa không?"),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Hủy"),
          ),
          TextButton(
            child: const Text(
              "Xóa",
              style: TextStyle(color: Colors.red),
            ),
            onPressed: () async {
              Navigator.pop(context); // đóng dialog

              // loading
              showDialog(
                context: context,
                barrierDismissible: false,
                builder: (_) =>
                const Center(child: CircularProgressIndicator()),
              );

              final success = await context
                  .read<RecipeProvider>()
                  .deleteRecipe(recipe.id);

              if (!context.mounted) return;

              Navigator.pop(context); // đóng loading

              if (success) {
                // quay về list + reload
                Navigator.pop(context, true);
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("Xóa công thức thất bại")),
                );
              }
            },
          ),
        ],
      ),
    );
  }
}
