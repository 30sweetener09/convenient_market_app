import 'package:flutter/material.dart';
class CustomHeader extends StatelessWidget
    implements PreferredSizeWidget {
  final bool showBack;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  const CustomHeader({
    super.key,
    this.showBack = false,
    this.onEdit,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: const Color(0xFF386633),
      elevation: 0,
      leading: showBack
          ? IconButton(
        icon: const Icon(Icons.arrow_back, color: Colors.white),
        onPressed: () => Navigator.pop(context),
      )
          : const Padding(
        padding: EdgeInsets.all(8),
        child: CircleAvatar(backgroundColor: Colors.white),
      ),
      title: const Text(
        "ĐiChợTiệnLợi",
        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontFamily: 'Unbounded', fontSize: 24),
      ),
      centerTitle: true,
      actions: [
        PopupMenuButton<String>(
          onSelected: (value) {
            if (value == 'edit') onEdit?.call();
            if (value == 'delete') onDelete?.call();
          },
          itemBuilder: (_) => const [
            PopupMenuItem(value: 'edit', child: Text('Sửa')),
            PopupMenuItem(value: 'delete', child: Text('Xóa')),
          ],
        ),
      ],
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
