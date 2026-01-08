import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/fridge_provider.dart';

class AddFridgeModal extends StatefulWidget {
  final int groupId;

  const AddFridgeModal({
    super.key,
    required this.groupId,
  });

  @override
  State<AddFridgeModal> createState() => _AddFridgeModalState();
}

class _AddFridgeModalState extends State<AddFridgeModal> {
  final _nameCtrl = TextEditingController();
  final _descCtrl = TextEditingController();

  bool _isSubmitting = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    final name = _nameCtrl.text.trim();
    final desc = _descCtrl.text.trim();

    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Tên tủ lạnh không được để trống')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final provider = context.read<FridgeProvider>();

    final fridge = await provider.createFridge(
      name: name,
      groupId: widget.groupId,
      description: desc.isEmpty ? null : desc,
    );

    setState(() => _isSubmitting = false);

    if (!mounted) return;

    if (fridge != null) {
      Navigator.pop(context, fridge);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Đã thêm tủ lạnh'),
          backgroundColor: Colors.green,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(provider.error ?? 'Tạo tủ thất bại'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.of(context).viewInsets.bottom;

    return Padding(
      padding: EdgeInsets.fromLTRB(16, 12, 16, bottomPadding + 16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // drag handle
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[400],
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(height: 12),

          const Text(
            'Thêm tủ lạnh',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 16),

          // tên tủ
          TextField(
            controller: _nameCtrl,
            decoration: const InputDecoration(
              labelText: 'Tên tủ lạnh',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),

          // mô tả
          TextField(
            controller: _descCtrl,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Mô tả (không bắt buộc)',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 20),

          // nút submit
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : _handleSubmit,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: _isSubmitting
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text(
                      'Thêm',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
