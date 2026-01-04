import 'package:di_cho_tien_loi/data/models/meal_plan_model.dart';
import 'package:di_cho_tien_loi/providers/meal_plan_provider.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../widgets/custom_header.dart';

class MealPlanDetailScreen extends StatefulWidget {
  final int mealPlanId;

  const MealPlanDetailScreen({super.key, required this.mealPlanId});

  @override
  State<MealPlanDetailScreen> createState() => _MealPlanDetailScreenState();
}

class _MealPlanDetailScreenState extends State<MealPlanDetailScreen> {
  late TextEditingController _descCtrl;
  bool _isEditing = false;
  String? _assignedUser;

  final List<String> _fakeUsers = ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C'];

  @override
  void initState() {
    super.initState();
    _descCtrl = TextEditingController();

    /// gọi API sau frame đầu
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final provider = context.read<MealPlanProvider>();
      final plan = await provider.getDetail(widget.mealPlanId);

      if (plan != null && mounted) {
        _descCtrl.text = plan.description;
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
          backgroundColor: Colors.white,
          appBar: CustomHeader(showBack: true),

          body: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            child: Column(
              children: [
                _buildMetaSection(plan),

                const SizedBox(height: 20),

                /// TEXT AREA (TRUNG TÂM)
                Expanded(child: _buildTextArea()),

                const SizedBox(height: 12),

                /// ACTIONS (ĐƯA XUỐNG DƯỚI)
                _buildBottomActions(),
              ],
            ),
          ),
        );
      },
    );
  }

  // ================= META CARD =================
  Widget _buildMetaSection(MealPlan plan) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          plan.name,
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
        ),

        const SizedBox(height: 4),

        Text(
          'Ngày: ${_formatDate(plan.timestamp)}',
          style: const TextStyle(
            fontSize: 13,
            fontStyle: FontStyle.italic,
            color: Colors.black45,
          ),
        ),

        if ((plan.description).isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(
            plan.description,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 14),
          ),
        ],
      ],
    );
  }

  Widget _buildTextArea() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: TextField(
        controller: _descCtrl,
        readOnly: !_isEditing,
        maxLines: null,
        expands: true,
        decoration: const InputDecoration(
          hintText: 'Ghi chú cho meal plan...',
          border: InputBorder.none,
        ),
      ),
    );
  }

  Widget _buildBottomActions() {
    if (_isEditing) {
      return _buildEditActions(); // có container
    }

    return _buildViewActions(); // KHÔNG container
  }

  Widget _buildViewActions() {
    return Row(
      children: [
        /// ✏️ EDIT – nền xanh, chữ trắng
        ElevatedButton.icon(
          onPressed: () {
            setState(() => _isEditing = true);
          },
          icon: const Icon(Icons.edit, size: 18),
          label: const Text('Chỉnh sửa'),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF2E7D32),
            foregroundColor: Colors.white,
            elevation: 0,
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),

        const SizedBox(width: 32),

        /// 🗑 DELETE – chữ đỏ, không nền
        TextButton.icon(
          onPressed: _confirmDelete,
          icon: const Icon(Icons.delete, size: 18, color: Colors.white),
          label: const Text('Xóa', style: TextStyle(color: Colors.white)),
          style: ElevatedButton.styleFrom(
            backgroundColor: Color(0xFFD32F2F),
            foregroundColor: Colors.white,
            elevation: 0,
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildEditActions() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          /// ASSIGN
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade400),
              color: Colors.white,
            ),
            child: DropdownButton<String>(
              value: _assignedUser,
              hint: const Text('Assign to'),
              isExpanded: true,
              underline: const SizedBox(),
              items: _fakeUsers
                  .map((u) => DropdownMenuItem(value: u, child: Text(u)))
                  .toList(),
              onChanged: (val) {
                setState(() => _assignedUser = val);
              },
            ),
          ),

          const SizedBox(height: 12),

          /// SAVE
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                setState(() => _isEditing = false);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2E7D32),
                foregroundColor: Colors.white,
                elevation: 0,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: const Text(
                'Lưu thay đổi',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _confirmDelete() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Xóa meal plan'),
        content: const Text('Bạn có chắc muốn xóa meal plan này không?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              // TODO: call delete API
            },
            child: const Text('Xóa', style: TextStyle(color: Colors.red)),
          ),
        ],
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
