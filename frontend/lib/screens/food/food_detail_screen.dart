import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../data/models/food_model.dart';
import '../../providers/food_provider.dart';
import 'food_form_dialog.dart';

class FoodDetailScreen extends StatelessWidget {
  final Food food;

  const FoodDetailScreen({super.key, required this.food});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Chi tiết thực phẩm"),
        backgroundColor: const Color(0xFF386633),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 🖼 Image
            Image.network(
              food.image,
              width: double.infinity,
              height: 240,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(
                height: 240,
                color: Colors.grey.shade200,
                child: const Center(child: Icon(Icons.image, size: 60)),
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Name
                  Text(
                    food.name,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 12),

                  _InfoRow(
                    icon: Icons.local_dining,
                    label: "Loại",
                    value: food.type,
                  ),

                  _InfoRow(
                    icon: Icons.category,
                    label: "Danh mục",
                    value: food.category,
                  ),

                  _InfoRow(
                    icon: Icons.scale,
                    label: "Đơn vị",
                    value: food.unit,
                  ),

                  const SizedBox(height: 24),

                  // Actions
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF386633),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          icon: const Icon(Icons.edit, color: Colors.white),
                          label: const Text(
                            "Chỉnh sửa",
                            style: TextStyle(color: Colors.white),
                          ),
                          onPressed: () async {
                            final reload = await showDialog<bool>(
                              context: context,
                              builder: (_) => FoodFormDialog(food: food),
                            );

                            if (reload == true && context.mounted) {
                              Navigator.pop(
                                context,
                                true,
                              ); // quay về list và reload
                            }
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            foregroundColor: Colors.white,
                            backgroundColor: Color(0xFFD32F2F),
                          ),
                          icon: const Icon(Icons.delete),
                          label: const Text("Xóa"),
                          onPressed: () => _confirmDelete(context),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmDelete(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text("Xóa thực phẩm"),
        content: Text("Bạn có chắc muốn xóa \"${food.name}\" không?"),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Hủy"),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context); // đóng dialog
              await _deleteFood(context);
            },
            child: const Text("Xóa", style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  Future<void> _deleteFood(BuildContext context) async {
    final provider = context.read<FoodProvider>();

    final success = await provider.deleteFood(food.id);

    if (!context.mounted) return;

    if (success) {
      Navigator.pop(context, true); // quay về list + reload
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Đã xóa thực phẩm")),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Xóa thất bại")),
      );
    }
  }
}

/// ================= INFO ROW =================
class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: Colors.grey),
          const SizedBox(width: 10),
          Text("$label: ", style: const TextStyle(fontWeight: FontWeight.w600)),
          Expanded(
            child: Text(value, style: TextStyle(color: Colors.grey.shade700)),
          ),
        ],
      ),
    );
  }
}
