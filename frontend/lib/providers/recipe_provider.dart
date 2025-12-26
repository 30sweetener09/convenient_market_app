import 'package:flutter/material.dart';

import '../data/models/recipe_model.dart';

class RecipeProvider extends ChangeNotifier {
  final List<Recipe> _recipes = [];

  List<Recipe> get recipes => _recipes;

  RecipeProvider() {
    loadMockData();
  }

  void loadMockData() {
    _recipes.addAll([
      Recipe(
        id: "1",
        title: "Spaghetti sốt cà chua",
        description: "Món ăn cổ điển của Ý...",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQW1PsgEhJ1j03TqWMROf-aA6PCkdSUJJ2Y-w&s",
      ),
    ]);
    notifyListeners();
  }
}
