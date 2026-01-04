import 'dart:convert';
import 'dart:io';
import 'package:http_parser/http_parser.dart';
import 'package:path/path.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../data/models/food_model.dart';

class FoodProvider extends ChangeNotifier {
  final String _baseUrl = 'https://convenient-market-app.onrender.com/api/food';

  final List<Food> _foods = [];
  final List<String> _units = [];
  final List<String> _categories = [];

  bool _isLoading = false;

  List<Food> get foods => _foods;
  List<String> get units => _units;
  List<String> get categories => _categories;
  bool get isLoading => _isLoading;

  // ================= FETCH FOODS =================
  Future<void> fetchFoods() async {
    _isLoading = true;
    notifyListeners();

    try {
      final token = await _getToken();
      if (token == null) return;

      final res = await http.get(
        Uri.parse('$_baseUrl/list'),
        headers: {
          "Authorization": "Bearer $token",
          "Content-Type": "application/json",
        },
      );

      if (res.statusCode == 200) {
        final body = jsonDecode(res.body);
        final List list = body['foods'] ?? [];

        _foods
          ..clear()
          ..addAll(list.map((e) => Food.fromJson(e)));

        debugPrint("✅ Fetch foods success: ${_foods.length}");
      } else {
        debugPrint("❌ Fetch foods failed: ${res.statusCode}");
      }
    } catch (e) {
      debugPrint("❌ Fetch foods error: $e");
    }

    _isLoading = false;
    notifyListeners();
  }

  // ================= FETCH UNITS =================
  Future<void> fetchUnits() async {
    try {
      final token = await _getToken();
      if (token == null) return;

      final res = await http.get(
        Uri.parse('$_baseUrl/unit'),
        headers: {
          "Authorization": "Bearer $token",
          "Accept": "application/json",
        },
      );

      if (res.statusCode == 200) {
        final body = jsonDecode(res.body);
        final List list = body['units'] ?? [];

        _units
          ..clear()
          ..addAll(list.map((e) => e['unitname'].toString()));

        notifyListeners();
      }
    } catch (e) {
      debugPrint("❌ Fetch units error: $e");
    }
  }

  // ================= FETCH CATEGORIES =================
  Future<void> fetchCategories() async {
    try {
      final token = await _getToken();
      if (token == null) return;

      final res = await http.get(
        Uri.parse('$_baseUrl/category'),
        headers: {
          "Authorization": "Bearer $token",
          "Accept": "application/json",
        },
      );

      if (res.statusCode == 200) {
        final body = jsonDecode(res.body);
        final List list = body['categories'] ?? [];

        _categories
          ..clear()
          ..addAll(list.map((e) => e['name'].toString()));

        notifyListeners();
      }
    } catch (e) {
      debugPrint("❌ Fetch categories error: $e");
    }
  }

  // ================= CREATE FOOD =================
  Future<bool> createFood({
    required String name,
    required String type, // Ingredient | Meal
    required String unitName,
    required String foodCategoryName,
    File? imageFile,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) return false;

      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$_baseUrl/create'),
      );

      request.headers['Authorization'] = 'Bearer $token';

      request.fields.addAll({
        'name': name,
        'type': type,
        'unitName': unitName,
        'foodCategoryName': foodCategoryName,
      });

      if (imageFile != null) {
        final ext = extension(imageFile.path).toLowerCase();

        MediaType mediaType;
        if (ext == '.png') {
          mediaType = MediaType('image', 'png');
        } else {
          mediaType = MediaType('image', 'jpeg');
        }

        request.files.add(
          await http.MultipartFile.fromPath(
            'image',
            imageFile.path,
            filename: basename(imageFile.path),
            contentType: mediaType, // ✅ QUAN TRỌNG
          ),
        );
      }

      debugPrint("📤 SEND CREATE FOOD REQUEST");

      final res = await http.Response.fromStream(await request.send());

      debugPrint("📥 CREATE FOOD STATUS: ${res.statusCode}");
      debugPrint("📥 CREATE FOOD BODY: ${res.body}");

      if (res.statusCode == 200 || res.statusCode == 201) {
        await fetchFoods(); // reload list
        return true;
      }
    } catch (e) {
      debugPrint("❌ Create food error: $e");
    }
    return false;
  }
  Future<bool> updateFood({
    required int id,
    required String name,
    required String type,
    required String unitName,
    required String foodCategoryName,
    File? imageFile,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) return false;

      final request = http.MultipartRequest(
        'PUT',
        Uri.parse('$_baseUrl/$id'),
      );

      request.headers['Authorization'] = 'Bearer $token';

      request.fields.addAll({
        'name': name,
        'type': type,
        'unitName': unitName,
        'foodCategoryName': foodCategoryName,
      });

      if (imageFile != null) {
        request.files.add(
          await http.MultipartFile.fromPath('image', imageFile.path),
        );
      }

      final res = await http.Response.fromStream(await request.send());

      if (res.statusCode == 200) {
        await fetchFoods();
        return true;
      }
    } catch (e) {
      debugPrint("❌ Update food error: $e");
    }
    return false;
  }
// ================= DELETE FOOD =================
  Future<bool> deleteFood(int id) async {
    try {
      final token = await _getToken();
      if (token == null) return false;

      final res = await http.delete(
        Uri.parse('$_baseUrl/$id'),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );

      if (res.statusCode == 200 || res.statusCode == 204) {
        _foods.removeWhere((f) => f.id == id);
        notifyListeners();
        return true;
      } else {
        debugPrint("❌ Delete food failed: ${res.statusCode}");
      }
    } catch (e) {
      debugPrint("❌ Delete food error: $e");
    }
    return false;
  }

  Future<void> searchFoods(String keyword) async {
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
        },
        body: jsonEncode({"name": keyword}),
      );

      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        final List list = decoded['foods'] ?? [];

        _foods
          ..clear()
          ..addAll(list.map((e) => Food.fromJson(e)));
      }
    } catch (e) {
      debugPrint("❌ searchFoods error: $e");
    }

    _isLoading = false;
    notifyListeners();
  }



  // ================= TOKEN =================
  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }
}
