import 'package:flutter/material.dart';

import '../data/models/food_model.dart';
import '../screens/food/food_detail_screen.dart';
class FoodCard extends StatelessWidget {
  final Food food;

  const FoodCard({super.key, required this.food});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => FoodDetailScreen(food: food),
          ),
        );
      },
      child: Card(
        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            // 🖼 Image
            ClipRRect(
              borderRadius: const BorderRadius.horizontal(
                left: Radius.circular(12),
              ),
              child: Image.network(
                food.image,
                width: 110,
                height: 110,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  width: 110,
                  height: 110,
                  color: Colors.grey.shade200,
                  child: const Icon(Icons.image, size: 40),
                ),
              ),
            ),

            // 📄 Info
            Expanded(
              child: Padding(
                padding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Name
                    Text(
                      food.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),

                    const SizedBox(height: 6),

                    // Type
                    Row(
                      children: [
                        const Icon(Icons.local_dining,
                            size: 16, color: Colors.grey),
                        const SizedBox(width: 6),
                        Text(
                          food.type,
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey.shade700,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 4),

                    // Category
                    Row(
                      children: [
                        const Icon(Icons.category,
                            size: 16, color: Colors.grey),
                        const SizedBox(width: 6),
                        Text(
                          food.category,
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey.shade700,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 4),

                    // Unit
                    Row(
                      children: [
                        const Icon(Icons.scale,
                            size: 16, color: Colors.grey),
                        const SizedBox(width: 6),
                        Text(
                          food.unit,
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey.shade700,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}