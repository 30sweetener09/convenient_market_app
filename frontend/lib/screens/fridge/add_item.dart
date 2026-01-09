import 'package:di_cho_tien_loi/data/models/food_model.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/fridge_item_provider.dart';
import '../../providers/food_provider.dart';

class AddItemSheet extends StatefulWidget {
  final int fridgeId;
  final int groupId;

  const AddItemSheet({
    super.key,
    required this.fridgeId,
    required this.groupId,
  });

  @override
  State<AddItemSheet> createState() => _AddItemSheetState();
}

class _AddItemSheetState extends State<AddItemSheet> {
  final _quantityCtrl = TextEditingController();

  int? _selectedFoodId;
  DateTime? _expiryDate;

  Food? get _selectedFood {
    if (_selectedFoodId == null) return null;
    return context
        .read<FoodProvider>()
        .foods
        .firstWhere((f) => f.id == _selectedFoodId);
  }

  @override
  void initState() {
    super.initState();
    context.read<FoodProvider>().fetchFoods();
  }

  @override
  void dispose() {
    _quantityCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final foodProvider = context.watch<FoodProvider>();

    return Padding(
      padding: EdgeInsets.fromLTRB(
        16,
        16,
        16,
        MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Center(
            child: Text(
              'Thêm thực phẩm',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 16),

          /// ===== FOOD DROPDOWN =====
          DropdownButtonFormField<int>(
            initialValue: _selectedFoodId,
            decoration: const InputDecoration(
              labelText: 'Thực phẩm',
              border: OutlineInputBorder(),
            ),
            items: foodProvider.foods.map((food) {
              return DropdownMenuItem<int>(
                value: food.id,
                child: Text(food.name),
              );
            }).toList(),
            onChanged: (value) {
              setState(() => _selectedFoodId = value);
            },
          ),

          const SizedBox(height: 12),

          Row(
            children: [
              /// ===== QUANTITY =====
              Expanded(
                flex: 1,
                child: TextField(
                  controller: _quantityCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Số lượng',
                    border: OutlineInputBorder(),
                  ),
                ),
              ),
              SizedBox(width: 6),

              /// ===== UNIT (READ ONLY) =====
              Expanded(
                flex: 1,
                child: TextFormField(
                  readOnly: true,
                  decoration: InputDecoration(
                    labelText: 'Đơn vị',
                    border: const OutlineInputBorder(),
                    hintText: _selectedFood?.unit ?? '',
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          /// ===== EXPIRY DATE =====
          InkWell(
            onTap: _pickExpiryDate,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade400),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.calendar_month),
                  const SizedBox(width: 12),
                  Text(
                    _expiryDate == null
                        ? 'Chọn hạn sử dụng'
                        : 'HSD: ${_formatDate(_expiryDate!)}',
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 24),

          /// ===== SUBMIT =====
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _canSubmit ? _submit : null,
              child: const Text('Thêm'),
            ),
          ),
        ],
      ),
    );
  }

  bool get _canSubmit =>
      _selectedFood != null &&
      _quantityCtrl.text.isNotEmpty &&
      _expiryDate != null;

  void _submit() async {
    final useWithinDays = _expiryDate!.difference(DateTime.now()).inDays;
    final provider = context.read<FridgeItemProvider>();

    await provider.createItem(
      widget.fridgeId,
      _selectedFood!.name,
      double.parse(_quantityCtrl.text),
      _selectedFood!.unit,
      useWithinDays,
    );
    await provider.fetchAllItems(fridgeId: widget.fridgeId);
    if (mounted) Navigator.pop(context);
  }

  Future<void> _pickExpiryDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );

    if (picked != null) {
      setState(() => _expiryDate = picked);
    }
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}-'
        '${date.month.toString().padLeft(2, '0')}-'
        '${date.year}';
  }
}
