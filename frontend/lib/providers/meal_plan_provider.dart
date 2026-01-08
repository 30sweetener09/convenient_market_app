import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../data/models/meal_plan_model.dart';
class MealPlanProvider extends ChangeNotifier {
  bool isLoading = false;
  List<MealPlan> _mealPlans = [];

  List<MealPlan> get mealPlans => _mealPlans;

  MealPlan? _mealPlan;
  MealPlan? get mealPlan => _mealPlan;

  static const _baseUrl =
      'https://convenient-market-app.onrender.com/api/meal';

  String formatDate(DateTime dt) {
    return '${dt.month.toString()}-'
        '${dt.day.toString()}-'
        '${dt.year}';
  }


  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }
  // ================= GET ALL ===============
  Future<void> fetchMealPlansByGroup(String groupId) async {
    isLoading = true;
    notifyListeners();

    try {
      final token = await _getToken();
      if (token == null) return;

      final res = await http.post(
        Uri.parse('$_baseUrl/getAll'),
        headers: {
          "accept": "*/*",
          "Authorization": "Bearer $token",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: {
          "groupId": groupId,
        }
      );

      debugPrint('🍽 MEAL PLAN STATUS: ${res.statusCode}');
      debugPrint('🍽 MEAL PLAN BODY: ${res.body}');

      if (res.statusCode == 200) {
        final body = jsonDecode(res.body);
        final List data = body['data'] ?? [];
        _mealPlans =
            data.map((e) => MealPlan.fromJson(e)).toList();
      }
    } catch (e) {
      debugPrint('❌ fetchMealPlans error: $e');
    }

    isLoading = false;
    notifyListeners();
  }

  // ===================DETAIL===================
  Future<MealPlan?> getDetail(int planId) async {
    isLoading = true;
    notifyListeners();

    try {
      final token = await _getToken();
      if (token == null) {
        isLoading = false;
        notifyListeners();
        return null;
      }
      debugPrint('🍽 MEAL PLAN DETAIL: START CALLING API');

      final res = await http.post(
        Uri.parse('$_baseUrl/detail'),
        headers: {
          "Authorization": "Bearer $token",
          "Content-Type": "application/json",
          "accept": "application/json",
        },
        body: jsonEncode({
          "planId": planId,
        }),
      );

      debugPrint('🍽 MEAL PLAN STATUS: ${res.statusCode}');
      debugPrint('🍽 MEAL PLAN BODY: ${res.body}');

      if (res.statusCode == 200) {
        final Map<String, dynamic> decoded = jsonDecode(res.body);

        final planJson = decoded['planById'];
        if (planJson != null) {
          _mealPlan = MealPlan.fromJson(planJson);
          return _mealPlan;
        }
      }
    } catch (e) {
      debugPrint('❌ getDetail error: $e');
    } finally {
      isLoading = false;
      notifyListeners();
    }

    return null;
  }
  Future<bool> createMealPlan({
    required String groupId,
    required String name,
    required String description,
    required DateTime timestamp,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) return false;

      final res = await http.post(
        Uri.parse(_baseUrl),
        headers: {
          "Authorization": "Bearer $token",
          "Content-Type": "application/json",
          "accept": "application/json",
        },
        body: jsonEncode({
          "groupId": int.parse(groupId),
          "name": name,
          "description": description,
          "timestamp": formatDate(timestamp),
        }),
      );

      debugPrint('🍽 CREATE STATUS: ${res.statusCode}');
      debugPrint('🍽 CREATE BODY: ${res.body}');

      if (res.statusCode == 200 || res.statusCode == 201) {
        final decoded = jsonDecode(res.body);
        final created = decoded['data'] ?? decoded['mealPlan'];

        if (created != null) {
          final newPlan = MealPlan.fromJson(created);

          // 👉 thêm lên đầu list
          _mealPlans.insert(0, newPlan);
          notifyListeners();
        }
        return true;
      }
    } catch (e) {
      debugPrint('❌ createMealPlan error: $e');
    }

    return false;
  }
  Future<bool> updateMealPlan({
    required String groupId,
    required int planId,
    required String newName,
    required DateTime newTimestamp,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) return false;

      final res = await http.put(
        Uri.parse(_baseUrl),
        headers: {
          "Authorization": "Bearer $token",
          "Content-Type": "application/json",
          "accept": "application/json",
        },
        body: jsonEncode({
          "groupId": int.parse(groupId),
          "planId": planId,
          "newName": newName,
          "newTimestamp": newTimestamp.toIso8601String(),
        }),
      );

      debugPrint('🍽 UPDATE STATUS: ${res.statusCode}');
      debugPrint('🍽 UPDATE BODY: ${res.body}');

      if (res.statusCode == 200) {
        // update local list
        final index = _mealPlans.indexWhere((e) => e.id == planId);
        if (index != -1) {
          _mealPlans[index] = _mealPlans[index].copyWith(
            name: newName,
            timestamp: newTimestamp.toIso8601String(),
          );
        }

        // update detail nếu đang mở
        if (_mealPlan?.id == planId) {
          _mealPlan = _mealPlan!.copyWith(
            name: newName,
            timestamp: newTimestamp.toIso8601String(),
          );
        }

        notifyListeners();
        return true;
      }
    } catch (e) {
      debugPrint('❌ updateMealPlan error: $e');
    }

    return false;
  }
  Future<bool> deleteMealPlan({
    required String groupId,
    required int planId,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) return false;

      final res = await http.delete(
        Uri.parse(_baseUrl),
        headers: {
          "Authorization": "Bearer $token",
          "Content-Type": "application/json",
          "accept": "application/json",
        },
        body: jsonEncode({
          "groupId": int.parse(groupId),
          "planId": planId,
        }),
      );

      debugPrint('🍽 DELETE STATUS: ${res.statusCode}');
      debugPrint('🍽 DELETE BODY: ${res.body}');

      if (res.statusCode == 200) {
        _mealPlans.removeWhere((e) => e.id == planId);

        if (_mealPlan?.id == planId) {
          _mealPlan = null;
        }

        notifyListeners();
        return true;
      }
    } catch (e) {
      debugPrint('❌ deleteMealPlan error: $e');
    }

    return false;
  }


}
