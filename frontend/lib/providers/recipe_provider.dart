import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../data/models/recipe_model.dart';

class RecipeProvider extends ChangeNotifier {
  final List<Recipe> _recipes = [];
  bool isLoading = false;
  String? _error;

  static const String _baseUrl =
      "https://convenient-market-app.onrender.com/api";

  List<Recipe> get recipes => _recipes;
  String? get error => _error;

  Future<void> fetchAllRecipe() async {
    //gọi API lấy danh sách món ăn
    isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('access_token');

      final response = await http.get(
        Uri.parse('$_baseUrl/recipes'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final List data = jsonDecode(response.body);

        _recipes
          ..clear()
          ..addAll(
            data.map((e) => Recipe.fromJson(e)).toList(),
          );
      } else if (response.statusCode == 401) {
        _error = 'Phiên đăng nhập hết hạn';
      } else {
        _error = 'Lỗi tải món ăn: ${response.body}';
      }
    } catch (e) {
      _error = 'Không thể kết nối server';
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  RecipeProvider() {
    fetchAllRecipe();
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
