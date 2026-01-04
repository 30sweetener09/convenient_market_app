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

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }

  Future<void> fetchMealPlansByGroup(String planId) async {
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
          "planId": planId,
        }
      );

      debugPrint('🍽 MEAL PLAN STATUS: ${res.statusCode}');
      debugPrint('🍽 MEAL PLAN BODY: ${res.body}');

      if (res.statusCode == 200) {
        final List data = jsonDecode(res.body);
        _mealPlans =
            data.map((e) => MealPlan.fromJson(e)).toList();
      }
    } catch (e) {
      debugPrint('❌ fetchMealPlans error: $e');
    }

    isLoading = false;
    notifyListeners();
  }
  Future<MealPlan?> getDetail(String groupId) async {
    isLoading = true;
    notifyListeners();

    try {
      final token = await _getToken();
      if (token == null) {
        isLoading = false;
        notifyListeners();
        return null;
      }

      final res = await http.post(
        Uri.parse('$_baseUrl/detail'),
        headers: {
          "Authorization": "Bearer $token",
          "Content-Type": "application/x-www-form-urlencoded",
          "accept": "application/json",
        },
        body: {
          "groupId": groupId,
        },
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

}
