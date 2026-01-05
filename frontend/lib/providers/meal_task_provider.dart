import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../data/models/meal_task.dart';

class MealTaskProvider extends ChangeNotifier {
  final List<MealTask> _tasks = [];

  bool _isLoading = false;
  String? _error;

  List<MealTask> get tasks => List.unmodifiable(_tasks);
  bool get isLoading => _isLoading;
  String? get error => _error;

  static const String _baseUrl = 'https://convenient-market-app.onrender.com/api/task';
  // ================= TOKEN =================
  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }

  // ================= FETCH TASKS =================
  Future<void> fetchTasks(int mealPlanId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final token = await _getToken();
      if (token == null) {
        throw Exception('Chưa đăng nhập');
      }

      final uri = Uri.parse("$_baseUrl/getAll");

      final res = await http.post(
        uri,
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: jsonEncode({"mealplan_id": mealPlanId})
      );

      debugPrint("fetching task of meal id $mealPlanId");
      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        final List list = decoded['task'] ?? [];

        _tasks
          ..clear()
          ..addAll(list.map((e) => MealTask.fromJson(e)));

      } else {
        _error = 'Lỗi tải task (${res.statusCode})';
      }
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  // ================= TOGGLE =================
  Future<void> toggleTask(MealTask task) async {
    task.isdone = !task.isdone;
    notifyListeners();

    // TODO: call API update status
  }

  // ================= ASSIGN =================
  Future<void> assignTask(MealTask task, String? userId) async {
    task.assigntouser_id = userId;
    notifyListeners();

    // TODO: call API assign user
  }

  // ================= ADD =================
  Future<void> addTask(String description, int mealPlanId) async {
    // TODO: call API create task
  }

  // ================= DELETE =================
  Future<void> deleteTask(MealTask task) async {
    _tasks.remove(task);
    notifyListeners();

    // TODO: call API delete task
  }

  // ================= CLEAR =================
  void clear() {
    _tasks.clear();
    notifyListeners();
  }
}
