import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:di_cho_tien_loi/providers/group_provider.dart';
import 'package:di_cho_tien_loi/providers/fridge_item_provider.dart';
import 'package:di_cho_tien_loi/screens/home/group_expiry_bar.dart';
import 'package:di_cho_tien_loi/screens/group/group_detail_screen.dart';

class GroupExpirySection extends StatelessWidget {
  const GroupExpirySection({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer2<GroupProvider, FridgeItemProvider>(
      builder: (context, groupProvider, fridgeItemProvider, _) {
        final groups = groupProvider.allGroups;

        if (groups == null || groups.isEmpty) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Text(
                    "Tủ lạnh của bạn",
                    style: TextStyle(fontSize: 20, fontFamily: 'Unbounded'),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Container(
                      height: 1.5,
                      decoration: BoxDecoration(
                        color: const Color.fromARGB(255, 89, 89, 89),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 28),
              Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.warning, color: Colors.grey, size: 20),
                    SizedBox (width: 12,),
                    Text(
                      "Bạn hiện chưa thuộc nhóm nào",
                      style: TextStyle(fontSize: 14, color: Colors.grey),
                    ),
                  ],
                ),
              ),
            ],
          );
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Text(
                  "Tủ lạnh của bạn",
                  style: TextStyle(fontSize: 20, fontFamily: 'Unbounded'),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Container(
                    height: 1.5,
                    decoration: BoxDecoration(
                      color: const Color.fromARGB(255, 89, 89, 89),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            ...groups.map((group) {
              final groupId = int.parse(group.id);
              final stats = fridgeItemProvider.getStatsByGroup(groupId);

              debugPrint(
                "📊 Group ${group.id} → "
                "${stats.safe}/${stats.warning}/${stats.expired}",
              );

              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: GroupExpiryBar(
                  groupName: group.name,
                  stats: stats,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) =>
                            GroupDetailScreen(groupId: group.id, indexTab: 2),
                      ),
                    );
                  },
                ),
              );
            }),
          ],
        );
      },
    );
  }
}
