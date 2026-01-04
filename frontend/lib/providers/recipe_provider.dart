import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:path/path.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../data/models/recipe_model.dart';

class RecipeProvider extends ChangeNotifier {
  final List<Recipe> _recipes = [];
  bool _isLoading = false;

  List<Recipe> get recipes => _recipes;
  bool get isLoading => _isLoading;

  static const String _baseUrl =
      'https://convenient-market-app.onrender.com/api/recipe';

  // ================= TOKEN =================
  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }

  // ================= FETCH LIST =================
  Future<void> fetchRecipes() async {
    _isLoading = true;
    notifyListeners();

    try {
      final token = await _getToken();
      if (token == null) {
        debugPrint("❌ No access_token found");
        return;
      }

      final res = await http.get(
        Uri.parse(_baseUrl),
        headers: {
          "Authorization": "Bearer $token",
        },
      );

      debugPrint("📥 FETCH RECIPES STATUS: ${res.statusCode}");
      debugPrint("📥 FETCH RECIPES BODY: ${res.body}");

      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        final List list = decoded['recipe'] ?? [];

        _recipes
          ..clear()
          ..addAll(list.map((e) => Recipe.fromJson(e)));
      }
    } catch (e) {
      debugPrint("❌ Fetch recipes error: $e");
    }

    _isLoading = false;
    notifyListeners();
  }

  // ================= CREATE =================
  Future<bool> createRecipe({
    required String name,
    required String description,
    required String htmlContent,
    File? image,
  }) async {
    final token = await _getToken();
    if (token == null) return false;

    try {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse(_baseUrl),
      );

      request.headers['Authorization'] = 'Bearer $token';
      request.headers['accept'] = 'application/json';

      request.fields['name'] = name;
      request.fields['description'] = description;
      request.fields['htmlContent'] = htmlContent;

      if (image != null) {
        final ext = extension(image.path).toLowerCase();
        final mediaType = ext == '.png'
            ? MediaType('image', 'png')
            : MediaType('image', 'jpeg');

        request.files.add(
          await http.MultipartFile.fromPath(
            'image',
            image.path,
            filename: basename(image.path),
            contentType: mediaType,
          ),
        );
      }

      final streamedRes = await request.send();
      final res = await http.Response.fromStream(streamedRes);

      debugPrint("📥 CREATE RECIPE STATUS: ${res.statusCode}");
      debugPrint("📥 CREATE RECIPE RESPONSE: ${res.body}");

      if (res.statusCode == 200 || res.statusCode == 201) {
        final data = jsonDecode(res.body);
        _recipes.insert(0, Recipe.fromJson(data['newRecipe']));
        notifyListeners();
        return true;
      }
    } catch (e) {
      debugPrint("❌ Create recipe error: $e");
    }

    return false;
  }

  // ================= DELETE =================
  Future<bool> deleteRecipe(int recipeId) async {
    final token = await _getToken();
    if (token == null) return false;

    try {
      final res = await http.delete(
        Uri.parse(_baseUrl),
        headers: {
          "Authorization": "Bearer $token",
          "Content-Type": "application/json",
          "accept": "application/json",
        },
        body: jsonEncode({
          "recipeId": recipeId,
        }),
      );

      if (res.statusCode == 200 || res.statusCode == 204) {
        _recipes.removeWhere((r) => r.id == recipeId);
        notifyListeners();
        return true;
      }
    } catch (e) {
      debugPrint("❌ Delete recipe error: $e");
    }

    return false;
  }

  // ================= SEARCH =================
  Future<void> searchRecipes(String keyword) async {
    _isLoading = true;
    notifyListeners();

    try {
      final token = await _getToken();
      if (token == null) return;

      final res = await http.post(
        Uri.parse('$_baseUrl/search'),
        headers: {
          "Authorization": "Bearer $token",
          "Content-Type": "application/json",
          "accept": "application/json",
        },
        body: jsonEncode({
          "name": keyword,
        }),
      );

      debugPrint("🔍 SEARCH STATUS: ${res.statusCode}");
      debugPrint("🔍 SEARCH RESPONSE: ${res.body}");

      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        final List list = decoded['recipe'] ?? [];

        _recipes
          ..clear()
          ..addAll(list.map((e) => Recipe.fromJson(e)));
      }
    } catch (e) {
      debugPrint("❌ Search error: $e");
    }

    _isLoading = false;
    notifyListeners();
  }
}
