import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../data/models/meal_plan_model.dart';
import '../../providers/meal_plan_provider.dart';
class MealPlanFormDialog extends StatefulWidget {
  final MealPlan? mealPlan; // null = create, != null = edit
  final String groupId;

  const MealPlanFormDialog({
    super.key,
    this.mealPlan,
    required this.groupId,
  });

  @override
  State<MealPlanFormDialog> createState() => _MealPlanFormDialogState();
}

class _MealPlanFormDialogState extends State<MealPlanFormDialog> {
  final _nameCtrl = TextEditingController();
  final _descCtrl = TextEditingController();

  DateTime? _selectedDate;

  @override
  void initState() {
    super.initState();

    if (widget.mealPlan != null) {
      final p = widget.mealPlan!;
      _nameCtrl.text = p.name;
      _descCtrl.text = p.description ?? '';
      _selectedDate = DateTime.parse(p.timestamp); // ✅ FIX
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
    );

    if (date == null) return;

    setState(() {
      _selectedDate = DateTime(
        date.year,
        date.month,
        date.day,
      ); // ⏰ giờ = 00:00
    });
  }


  Future<void> _submit() async {
    if (_nameCtrl.text.trim().isEmpty || _selectedDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng nhập đầy đủ thông tin')),
      );
      return;
    }

    final provider = context.read<MealPlanProvider>();
    bool success;

    if (widget.mealPlan == null) {
      /// CREATE
      success = await provider.createMealPlan(
        groupId: widget.groupId,
        name: _nameCtrl.text.trim(),
        description: _descCtrl.text.trim(),
        timestamp: _selectedDate!,
      );
    } else {
      /// UPDATE
      success = await provider.updateMealPlan(
        groupId: widget.groupId,
        planId: widget.mealPlan!.id,
        newName: _nameCtrl.text.trim(),
        newTimestamp: _selectedDate!,
      );
    }

    if (success && mounted) {
      Navigator.pop(context, true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Thao tác thất bại')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: const EdgeInsets.all(16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              widget.mealPlan == null
                  ? 'Tạo kế hoạch bữa ăn'
                  : 'Chỉnh sửa kế hoạch bữa ăn',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),

            const SizedBox(height: 16),

            _buildTextField('Tên kế hoạch', _nameCtrl),
            _buildTextField('Mô tả', _descCtrl, maxLines: 3),

            const SizedBox(height: 8),

            /// DATETIME
            Row(
              children: [
                Expanded(
                  child: Text(
                    _selectedDate == null
                        ? 'Chưa chọn thời gian'
                        : '⏰ ${_formatDate(_selectedDate!)}',
                  ),
                ),
                ElevatedButton(
                  onPressed: _pickDate,
                  child: const Text('Chọn'),
                ),
              ],
            ),

            const SizedBox(height: 20),

            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: _submit,
                    child: const Text('Xác nhận'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text(
                      'Hủy',
                      style: TextStyle(color: Colors.red),
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

  Widget _buildTextField(
      String label,
      TextEditingController ctrl, {
        int maxLines = 1,
      }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: ctrl,
        maxLines: maxLines,
        decoration: InputDecoration(
          labelText: label,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime d) {
    return '${d.day.toString().padLeft(2, '0')}/'
        '${d.month.toString().padLeft(2, '0')}/'
        '${d.year}';
  }

}
