import 'package:di_cho_tien_loi/data/dto/fridge_item_dto.dart';
import 'package:flutter/material.dart';

class ItemCard extends StatelessWidget {
  final FridgeItemDTO item;
  final VoidCallback? onDelete;

  const ItemCard({super.key, this.onDelete, required this.item});

  @override
  Widget build(BuildContext context) {
    final expiryDate = item.expiryDate;
    final now = DateTime.now();

    final isExpired = expiryDate != null && expiryDate.isBefore(now);

    final isNearExpired =
        expiryDate != null &&
        !isExpired &&
        expiryDate.difference(now).inDays <= 3;

    return Dismissible(
      key: ValueKey(item.id),

      /// 👉 vuốt từ phải sang trái
      direction: DismissDirection.endToStart,

      /// 👉 nền đỏ + icon xoá
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        decoration: BoxDecoration(
          color: Colors.red,
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Icon(Icons.delete, color: Colors.white),
      ),

      /// 👉 hỏi xác nhận trước khi xoá
      confirmDismiss: (_) async {
        return await showDialog<bool>(
          context: context,
          builder: (_) => AlertDialog(
            title: const Text('Xoá thực phẩm'),
            content: Text('Bạn có chắc muốn xoá "${item.foodName}" không?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Huỷ'),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                onPressed: () => Navigator.pop(context, true),
                child: const Text('Xoá'),
              ),
            ],
          ),
        );
      },

      /// 👉 gọi xoá thật
      onDismissed: (_) {
        onDelete?.call();

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Đã xoá ${item.foodName}'),
            backgroundColor: Colors.red,
          ),
        );
      },

      child: _buildTile(isExpired, isNearExpired),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}-'
        '${date.month.toString().padLeft(2, '0')}-'
        '${date.year}';
  }

  Widget _buildTile (bool isExpired, bool isNearExpired) {
    return ListTile(
      leading: CircleAvatar(
        backgroundImage: item.imageUrl != null && item.imageUrl!.isNotEmpty
            ? NetworkImage(item.imageUrl!)
            : null,
        backgroundColor: Colors.grey[200],
        child: (item.imageUrl == null || item.imageUrl!.isEmpty)
            ? const Icon(Icons.fastfood, color: Colors.grey)
            : null,
      ),
      title: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            item.foodName ?? '',
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          Text(
            '${item.quantity} ${item.unit}',
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
        ],
      ),

      subtitle: Row(
        children: [
          if (isExpired)
            const Icon(Icons.warning, color: Colors.red, size: 16)
          else if (isNearExpired)
            const Icon(Icons.warning, color: Color.fromARGB(255, 255, 164, 7), size: 16),

          if (item.expiryDate != null)
            Text(
              ' HSD: ${_formatDate(item.expiryDate!)}',
              style: TextStyle(
                color: isExpired
                    ? Colors.red
                    : isNearExpired
                    ? Color.fromARGB(255, 255, 164, 7)
                    : Colors.grey[700],
              ),
            ),
        ],
      ),
      //trailing: isExpired ? const Icon(Icons.warning, color: Colors.red) : null,
    );
  }
}
