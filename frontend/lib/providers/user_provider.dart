import 'dart:convert';
import 'package:di_cho_tien_loi/data/dto/user_dto.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class UserProvider extends ChangeNotifier {
  UserDTO? _user;
  bool isLoading = false;
  String? _error;

  static const String _baseUrl =
      "https://convenient-market-app.onrender.com/api";

  UserProvider();

  UserDTO? get user => _user;
  String? get error => _error;

  // Thêm method reset error
  void resetError() {
    _error = null;
    notifyListeners();
  }

  //Xoá tài khoản
  Future<void> delete() async {
    final prefs = await SharedPreferences.getInstance();
  
    final token = prefs.getString('token') ?? '';

    isLoading = true;
    notifyListeners();

    final url = Uri.parse('$_baseUrl/user');
    final response = await http.delete(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      _user = null;
      await prefs.remove('token');
    } else {
      _error = 'Xoá tài khoản thất bại: ${response.body}';
    }

    isLoading = false;
    notifyListeners();
  }
}