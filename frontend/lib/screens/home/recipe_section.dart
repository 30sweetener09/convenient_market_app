import 'package:di_cho_tien_loi/screens/home/recipe_home_helper.dart';
import 'package:di_cho_tien_loi/screens/recipe/recipe_detail_screen.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/recipe_provider.dart';
import '../../data/models/recipe_model.dart';

class RecipeHomeSection extends StatelessWidget {
  const RecipeHomeSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<RecipeProvider>(
      builder: (context, provider, _) {
        final recipes = provider.getRandomRecipes(3);

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Gợi ý công thức',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),

            SizedBox(
              height: 180,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  ...recipes.map(
                    (recipe) => _RecipeCard(recipe: recipe),
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}

class _RecipeCard extends StatelessWidget {
  final Recipe recipe;
  const _RecipeCard({required this.recipe});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => RecipeDetailScreen(recipe: recipe),
          ),
        );
      },
      child: Container(
        width: 140,
        margin: const EdgeInsets.only(right: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              blurRadius: 8,
              color: Colors.black.withOpacity(0.08),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(16),
              ),
              child: Image.network(
                recipe.image,
                height: 100,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) =>
                    Container(height: 100, color: Colors.grey[300]),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(8),
              child: Text(
                recipe.name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
class _AddRecipeCard extends StatelessWidget {
  final VoidCallback onTap;
  const _AddRecipeCard({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 140,
        margin: const EdgeInsets.only(right: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey),
        ),
        child: const Center(
          child: Icon(Icons.add, size: 36),
        ),
      ),
    );
  }
}
