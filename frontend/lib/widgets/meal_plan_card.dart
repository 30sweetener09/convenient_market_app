import 'package:flutter/material.dart';

class MealPlanCard extends StatelessWidget {
  final String name;
  final DateTime date;
  final String description;
  final bool isStarred;
  // final String userEmail;
  final VoidCallback? onTap;

  const MealPlanCard({
    super.key,
    required this.name,
    required this.date,
    required this.description,
    required this.isStarred,
    // required this.userEmail,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(12),

        /// Title
        title: Text(
          name,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),

        /// Subtitle
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text('Ngày: $date'),
            const SizedBox(height: 2),
            Text(
              'Ghi chú: $description',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            // const SizedBox(height: 4),
            // Text(
            //   'Người mua: $userEmail',
            //   style: TextStyle(
            //     fontSize: 12,
            //     color: Colors.grey[600],
            //   ),
            // ),
          ],
        ),

        /// Trailing
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Icon(
              isStarred ? Icons.star : Icons.star_border,
              color: isStarred ? Colors.amber : Colors.grey,
            ),
            const Icon(Icons.more_vert),
          ],
        ),

        onTap: onTap,
      ),
    );
  }
}
