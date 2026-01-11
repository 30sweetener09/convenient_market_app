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
          return const Center(
            child: Text(
              "Chưa có nhóm nào",
              style: TextStyle(fontSize: 16),
            ),
          );
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "Tủ lạnh của bạn",
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
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
