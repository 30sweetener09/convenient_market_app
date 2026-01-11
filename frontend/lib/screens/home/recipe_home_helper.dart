import 'dart:math';
import 'package:di_cho_tien_loi/providers/recipe_provider.dart';
import '../../data/models/recipe_model.dart';

extension RecipeHomeHelper on RecipeProvider {
  List<Recipe> getRandomRecipes(int count) {
    if (recipes.isEmpty) return [];

    final shuffled = List<Recipe>.from(recipes)..shuffle(Random());
    return shuffled.take(count).toList();
  }
}
