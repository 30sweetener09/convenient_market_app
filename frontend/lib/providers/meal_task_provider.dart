import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../data/models/meal_task.dart';

class MealTaskProvider extends ChangeNotifier {
  final List<MealTask> _tasks = [];

  bool _isLoading = false;
  String? _error;

  List<MealTask> get tasks => _tasks;

  bool get isLoading => _isLoading;

  String? get error => _error;

  static const String _baseUrl =
      'https://convenient-market-app.onrender.com/api/task';

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
          'Content-Type': 'application/json',
        },
        body: jsonEncode({"mealplan_id": mealPlanId}),
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
  Future<void> toggleTask(MealTask task, String groupId) async {
    final oldValue = task.isdone;
    task.isdone = !oldValue;
    notifyListeners();

    try {
      final token = await _getToken();
      if (token == null) throw Exception('Chưa đăng nhập');

      final res = await http.patch(
        Uri.parse(_baseUrl),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          "groupId": groupId,
          "taskId": task.id.toString(),
        }),
      );

      if (res.statusCode != 200) {
        throw Exception('Toggle task thất bại');
      }
    } catch (e) {
      // ❌ rollback nếu lỗi
      task.isdone = oldValue;
      _error = e.toString();
      notifyListeners();
    }
  }

// ================= ASSIGN =================
  Future<void> assignTask(
      MealTask task,
      String? userId,
      String groupId,
      ) async {
    final oldUser = task.assigntouser_id;
    task.assigntouser_id = userId;
    notifyListeners();

    try {
      final token = await _getToken();
      if (token == null) throw Exception('Chưa đăng nhập');

      final res = await http.put(
        Uri.parse('$_baseUrl/${task.id}/assign'),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          "assignToUserId": userId,
        }),
      );
      debugPrint('${res.statusCode} ${res.body} ');

      if (res.statusCode != 200) {
        throw Exception('Assign task thất bại');
      }
    } catch (e) {
      // rollback
      task.assigntouser_id = oldUser;
      _error = e.toString();
      notifyListeners();
    }

  }


  Future<void> addTask({
    required int mealPlanId,
    required String name,
    required String description,
    String? assignToUserId,
    required String groupId,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) throw Exception('Chưa đăng nhập');

      final uri = Uri.parse(_baseUrl);
      final res = await http.post(
        uri,
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          "groupId": groupId,
          "mealplan_id": mealPlanId, // 👈 Gửi dạng int nếu API nhận int
          "name": name,
          "description": description,
          "assignToUserId": assignToUserId,
        }),
      );

      if (res.statusCode == 200 || res.statusCode == 201) {
        // ✅ Cách 1: Gọi lại fetch để đồng bộ 100% với server
        await fetchTasks(mealPlanId);
      } else {
        _error = 'Tạo task thất bại';
        notifyListeners();
      }
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

// ================= DELETE =================
  Future<void> deleteTask(MealTask task, String groupId) async {
    final index = _tasks.indexOf(task);
    if (index == -1) return;

    _tasks.removeAt(index);
    notifyListeners();

    try {
      final token = await _getToken();
      if (token == null) throw Exception('Chưa đăng nhập');

      final res = await http.delete(
        Uri.parse(_baseUrl),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          "groupId": groupId,
          "taskId": task.id.toString(),
        }),
      );

      if (res.statusCode != 200) {
        throw Exception('Xóa task thất bại');
      }
    } catch (e) {
      // ❌ rollback
      _tasks.insert(index, task);
      _error = e.toString();
      notifyListeners();
    }
  }


  // ================= CLEAR =================
  void clear() {
    _tasks.clear();
    notifyListeners();
  }

  Future<void> getMyTask() async {
    try {
      final token = await _getToken();
      if (token == null) throw Exception('Chưa đăng nhập');

      final uri = Uri.parse("$_baseUrl/getMyTask");
      final res = await http.get(
        uri,
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );
      if (res.statusCode == 200 || res.statusCode == 201) {
        final decoded = jsonDecode(res.body);
        final List list = decoded['data'] ?? [];

        _tasks
          ..clear()
          ..addAll(list.map((e) => MealTask.fromJson(e)));
        _error = null;
        notifyListeners();
      } else {
        _error = 'Tìm task của user thất bại';
        notifyListeners();
      }
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }
}
