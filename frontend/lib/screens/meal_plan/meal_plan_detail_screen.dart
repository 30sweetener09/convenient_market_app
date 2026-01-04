import 'package:di_cho_tien_loi/widgets/custom_bottom_nav.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:di_cho_tien_loi/data/models/meal_plan_model.dart';
import 'package:di_cho_tien_loi/providers/meal_plan_provider.dart';

class MealPlanDetailScreen extends StatefulWidget {
  final String mealPlanId;

  const MealPlanDetailScreen({
    super.key,
    required this.mealPlanId,
  });

  @override
  State<MealPlanDetailScreen> createState() => _MealPlanDetailScreenState();
}

class _MealPlanDetailScreenState extends State<MealPlanDetailScreen> {
  late TextEditingController _descCtrl;

  @override
  void initState() {
    super.initState();
    _descCtrl = TextEditingController();

    /// gọi API sau frame đầu
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final provider = context.read<MealPlanProvider>();
      final plan = await provider.getDetail(widget.mealPlanId);

      if (plan != null && mounted) {
        _descCtrl.text = plan.description ?? '';
      }
    });
  }

  @override
  void dispose() {
    _descCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<MealPlanProvider>(
      builder: (_, provider, __) {
        if (provider.isLoading) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        final MealPlan? plan = provider.mealPlan;

        if (plan == null) {
          return const Scaffold(
            body: Center(child: Text('Không tìm thấy meal plan')),
          );
        }

        return Scaffold(
          appBar: AppBar(
            leading: IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: () => Navigator.pop(context),
            ),
            title: Text(
              plan.name,
              style: const TextStyle(fontSize: 18),
            ),
            actions: const [
              Icon(Icons.more_vert),
            ],
          ),

          /// 🔽 BODY
          body: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                /// Metadata
                _buildMetaCard(plan),

                const SizedBox(height: 12),

                /// Text area lớn
                Expanded(
                  child: TextField(
                    controller: _descCtrl,
                    maxLines: null,
                    expands: true,
                    decoration: InputDecoration(
                      hintText: 'Nhập ghi chú cho meal plan...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      contentPadding: const EdgeInsets.all(12),
                    ),
                  ),
                ),
              ],
            ),
          ),

          /// Bottom bar
          bottomNavigationBar: CustomBottomNav(currentIndex: 0, onTap: (_) {},),
        );
      },
    );
  }

  // ================= META CARD =================
  Widget _buildMetaCard(MealPlan plan) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            /// Name
            Text(
              plan.name,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),

            const SizedBox(height: 6),

            /// Date
            Row(
              children: [
                const Icon(Icons.calendar_today, size: 16),
                const SizedBox(width: 6),
                Text(_formatDate(plan.timestamp as String)),
              ],
            ),

            const SizedBox(height: 8),

            /// Status
            Row(
              children: [
                const Icon(Icons.star, size: 16, color: Colors.amber),
                const SizedBox(width: 6),
                Text(plan.status),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(String timestamp) {
    final date = DateTime.parse(timestamp);
    return '${date.day.toString().padLeft(2, '0')}/'
        '${date.month.toString().padLeft(2, '0')}/'
        '${date.year}';
  }
}
