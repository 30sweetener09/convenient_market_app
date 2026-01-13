import 'package:di_cho_tien_loi/providers/group_provider.dart';
import 'package:di_cho_tien_loi/providers/meal_task_provider.dart';
import 'package:di_cho_tien_loi/screens/meal_plan/meal_plan_detail_screen.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../data/models/meal_task.dart';
import 'package:collection/collection.dart';


class TaskSection extends StatefulWidget {
  const TaskSection({super.key});

  @override
  State<TaskSection> createState() => _TaskSectionState();
}

class _TaskSectionState extends State<TaskSection> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    return Consumer<MealTaskProvider>(
      builder: (context, provider, _) {
        final allTasks = provider.tasks.where((t) => !t.isdone).toList();

        final visibleTasks = _expanded ? allTasks : allTasks.take(2).toList();

        return Container(
          //padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            color: Theme.of(context).colorScheme.surface,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              /// ===== HEADER =====
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Việc cần làm',
                    style: TextStyle(fontSize: 20, fontFamily: 'Unbounded'),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Container(
                      height: 1.5,
                      decoration: BoxDecoration(
                        color: const Color.fromARGB(255, 90, 90, 90),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  if (allTasks.isNotEmpty)
                    GestureDetector(
                      onTap: () {
                        setState(() {
                          _expanded = !_expanded;
                        });
                      },
                      child: Text(
                        _expanded ? 'Thu gọn' : 'Xem tất cả',
                        style: const TextStyle(color: Colors.green),
                      ),
                    ),
                ],
              ),

              const SizedBox(height: 12),

              /// ===== BODY =====
              if (allTasks.isEmpty)
                _buildDoneState()
              else
                Column(
                  children: visibleTasks.map((task) {
                    return _TaskItem(task: task);
                  }).toList(),
                ),
            ],
          ),
        );
      },
    );
  }

  /// ===== EMPTY / DONE STATE =====
  Widget _buildDoneState() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.check_circle, color: Colors.grey, size: 20),
          const SizedBox(width: 12),
          Text(
            'Bạn chưa có công việc nào cần làm',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14, color: Colors.grey),
          ),
        ],
      ),
    );
  }
}

class _TaskItem extends StatelessWidget {
  final MealTask task;

  const _TaskItem({required this.task});

  @override
  Widget build(BuildContext context) {
    return Consumer<GroupProvider>(
      builder: (context, groupProvider, _) {
        String? groupName;

        if (task.group_id != null && groupProvider.allGroups != null) {
          final group = groupProvider.allGroups
            ?.firstWhereOrNull((g) => int.tryParse(g.id) == task.group_id);
          groupName = group?.name;
        }

        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 6,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 4,
            ),
            leading: const SizedBox(width: 8),
            title: Text(
              task.name,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            subtitle: groupName != null
                ? Text(
                    "Nhóm: $groupName",
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  )
                : const Text(
                    'Nhóm không xác định',
                    style: TextStyle(fontSize: 12),
                  ),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) =>
                      MealPlanDetailScreen(mealPlanId: task.mealplan_id),
                ),
              );
            },
          ),
        );
      },
    );
  }
}
