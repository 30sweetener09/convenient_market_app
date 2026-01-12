import 'package:flutter/material.dart';
import '../data/dto/group_member_dto.dart';

class MemberCard extends StatelessWidget {
  final MemberDTO member;
  final VoidCallback? onView;
  final VoidCallback? onDelete;

  const MemberCard({
    super.key,
    required this.member,
    this.onView,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.grey.shade100,
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: Colors.grey.shade300, // màu border
          width: 1,
        ),
      ),
      elevation: 0, // 0 = phẳng, tăng lên nếu muốn nổi
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 24,
          vertical: 12,
        ),

        leading: CircleAvatar(
          radius: 24,
          backgroundColor: Colors.grey.shade300,
          backgroundImage:
              member.imageurl != null && member.imageurl!.isNotEmpty
              ? NetworkImage(member.imageurl!)
              : null,
          child: member.imageurl == null || member.imageurl!.isEmpty
              ? const Icon(Icons.image, color: Colors.white)
              : null,
        ),

        title: Row(
          children: [
            Flexible(
              child: Text(
                member.username,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
            ),
            const SizedBox(width: 6),
            if (member.roleInGroup != null)
              const Icon(Icons.verified, size: 16, color: Colors.grey),
          ],
        ),

        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Account: ${member.email}',
              style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
            ),
            if (member.roleInGroup == "groupAdmin")
              Text(
                "Trưởng nhóm",
                style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
              ),
          ],
        ),

        trailing: PopupMenuButton<String>(
          onSelected: (value) {
            if (value == 'view') onView?.call();
            if (value == 'delete') onDelete?.call();
          },
          itemBuilder: (context) => const [
            PopupMenuItem(value: 'view', child: Text('Xem')),
            PopupMenuItem(
              value: 'delete',
              child: Text('Xoá', style: TextStyle(color: Colors.red)),
            ),
          ],
        ),
      ),
    );
  }
}
