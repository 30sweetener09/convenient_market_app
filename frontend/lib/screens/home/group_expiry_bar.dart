import 'package:di_cho_tien_loi/data/models/group_expiry_stats.dart';
import 'package:flutter/material.dart';

class GroupExpiryBar extends StatelessWidget {
  final String groupName;
  final GroupExpiryStats stats;
  final VoidCallback? onTap;

  const GroupExpiryBar({
    super.key,
    required this.groupName,
    required this.stats,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final total = stats.total == 0 ? 1 : stats.total;
    double ratio(int value) =>
        total == 0 ? 0 : value / total;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            /// Group name
            Row (
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
              Text(
              groupName,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            
            Text(
              "Số lượng: $total",
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Colors.grey
              ),
            ),
            ],),
            

            const SizedBox(height: 8),

            /// Stats text
            Text(
              "🟢 ${stats.safe} còn hạn   "
              "🟡 ${stats.warning} sắp hết   "
              "🔴 ${stats.expired} hết hạn",
              style: const TextStyle(fontSize: 13),
            ),

            const SizedBox(height: 10),

            /// Progress bar
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: SizedBox(
                height: 12,
                child: Row(
                  children: [
                    _bar(ratio(stats.safe), Colors.green),
                    _bar(ratio(stats.warning), Colors.orange),
                    _bar(ratio(stats.expired), Colors.red),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _bar(double ratio, Color color) {
    return Expanded(
      flex: (ratio * 100).toInt(),
      child: Container(color: color),
    );
  }
}
