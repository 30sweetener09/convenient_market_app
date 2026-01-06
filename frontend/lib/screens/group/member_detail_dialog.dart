import 'package:di_cho_tien_loi/data/dto/group_member_dto.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class MemberDetailDialog extends StatelessWidget {
  final MemberDTO member;

  const MemberDetailDialog({super.key, required this.member});

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: const Text('Thông tin thành viên'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Avatar
              CircleAvatar(
                radius: 36,
                backgroundColor: Colors.grey.shade300,
                backgroundImage:
                    member.imageurl != null && member.imageurl!.isNotEmpty
                    ? NetworkImage(member.imageurl!)
                    : null,
                child: member.imageurl == null || member.imageurl!.isEmpty
                    ? const Icon(Icons.person, size: 32, color: Colors.white)
                    : null,
              ),

              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Username
                  Text(
                    member.username,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),

                  const SizedBox(height: 2),

                  // Email
                  Text(
                    member.email,
                    style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                  ),
                ],
              ),
              
            ],
          ),
          const SizedBox(height: 8),
          // Role
          if (member.roleInGroup == 'groupAdmin')
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                'Trưởng nhóm',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.green,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          const SizedBox(height: 8),
          Text(
            "Ngày tham gia: ${DateFormat('dd-MM-yyyy').format(member.joinedAt!)}",
            style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Đóng'),
        ),
      ],
    );
  }
}
