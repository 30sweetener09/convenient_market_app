import 'dart:convert';
import 'dart:io';
import 'package:http_parser/http_parser.dart';


import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
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

  // ================= FETCH LIST =================
  Future<void> fetchRecipes() async {
    _isLoading = true;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      if (token == null) {
        debugPrint("No token found");
        return;
      }

      final res = await http.get(
        Uri.parse(_baseUrl),
        headers: {
          "Authorization": "Bearer $token",
        },
      );

      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        final List list = decoded['recipe'] ?? [];

        _recipes
          ..clear()
          ..addAll(list.map((e) => Recipe.fromJson(e)));
      } else {
        debugPrint("Fetch recipes failed: ${res.statusCode}");
        debugPrint(res.body);
      }
    } catch (e) {
      debugPrint("Fetch recipes error: $e");
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
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');

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

        MediaType mediaType;
        if (ext == '.png') {
          mediaType = MediaType('image', 'png');
        } else {
          mediaType = MediaType('image', 'jpeg');
        }

        request.files.add(
          await http.MultipartFile.fromPath(
            'image',
            image.path,
            filename: basename(image.path),
            contentType: mediaType, // ✅ QUAN TRỌNG
          ),
        );
      }


      final streamedRes = await request.send();
      final res = await http.Response.fromStream(streamedRes);

      // ✅ LOG CHI TIẾT
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
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');

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
        // xóa local list
        _recipes.removeWhere((r) => r.id == recipeId);
        notifyListeners();
        return true;
      } else {
        debugPrint("Delete recipe failed: ${res.statusCode}");
        debugPrint(res.body);
      }
    } catch (e) {
      debugPrint("Delete recipe error: $e");
    }

    return false;
  }
  // ================= SEARCH (POST + BODY) =================
  Future<void> searchRecipes(String keyword) async {
    _isLoading = true;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

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
      } else {
        debugPrint("Search failed");
      }
    } catch (e) {
      debugPrint("❌ Search error: $e");
    }

    _isLoading = false;
    notifyListeners();
  }

}
