import 'package:flutter/material.dart';

import '../../../data/dto/group_member_dto.dart';
import '../../../data/models/meal_task.dart';

class TaskCard extends StatelessWidget {
  final MealTask task;
  final List<MemberDTO>? users;
  final VoidCallback onToggle;
  final Function(String?) onAssign;
  final VoidCallback onDelete;

  const TaskCard({
    super.key,
    required this.task,
    this.users,
    required this.onToggle,
    required this.onAssign,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: ValueKey(task.id),
      direction: DismissDirection.endToStart,
      onDismissed: (_) => onDelete(),
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        color: Colors.red,
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
        decoration: BoxDecoration(
          color: task.isdone ? Colors.green.shade50 : Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: task.isdone ? Colors.green.shade300 : Colors.grey.shade300,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 6,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            /// 🔹 ROW 1: CHECKBOX + DESCRIPTION (NGANG HÀNG)
            IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Checkbox(
                    value: task.isdone,
                    onChanged: (_) => onToggle(),
                    visualDensity: VisualDensity.compact,
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      task.description,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                        decoration: task.isdone
                            ? TextDecoration.lineThrough
                            : null,
                        color: task.isdone ? Colors.grey : Colors.black87,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 8),

            /// 🔹 ROW 2: ASSIGN DROPDOWN (MẢNH – BO TRÒN)
            Container(
              height: 36,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: DropdownButton<String?>(
                value: users!.any((u) => u.id == task.assigntouser_id)
                    ? task.assigntouser_id
                    : null,
                hint: const Text(
                  'Assign to',
                  style: TextStyle(color: Colors.grey, fontSize: 13),
                ),
                underline: const SizedBox(),
                isExpanded: true,
                icon: const Icon(Icons.keyboard_arrow_down_rounded, size: 20),
                // itemHeight: 40,
                style: const TextStyle(fontSize: 13, color: Colors.black87),
                items: [
                  const DropdownMenuItem<String?>(
                    value: null,
                    child: Text(
                      'Assign to',
                      style: TextStyle(color: Colors.grey, fontSize: 13),
                    ),
                  ),
                  ...users!.map((u) {
                    return DropdownMenuItem<String?>(
                      value: u.id,
                      child: Row(
                        children: [
                          const Icon(
                            Icons.person,
                            size: 16,
                            color: Colors.grey,
                          ),
                          const SizedBox(width: 6),
                          Text(u.username),
                        ],
                      ),
                    );
                  }).toList(),
                ],
                onChanged: task.isdone ? null : onAssign,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
