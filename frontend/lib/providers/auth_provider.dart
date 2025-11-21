import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class AuthProvider extends ChangeNotifier {
  bool isLoggedIn = false;
  bool isLoading = false;
  String? error;
  String? token;

  static const String _baseUrl = "https://convenient-market-app.onrender.com/api";

  AuthProvider() {
    _loadToken();
  }

  /// Load token từ local khi app khởi động
  Future<void> _loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    token = prefs.getString('token');

    if (token != null) {
      // Kiểm tra token còn hạn không (tuỳ backend có endpoint check hoặc decode JWT)
      final expired = _isTokenExpired(token!);
      if (!expired) {
        isLoggedIn = true;
      } else {
        await logout();
      }
    }
    notifyListeners();
  }

  /// Hàm kiểm tra token có hết hạn không (decode JWT phần payload)
  bool _isTokenExpired(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return true;
      final payload = jsonDecode(utf8.decode(base64Url.decode(base64Url.normalize(parts[1]))));
      final exp = payload['exp'];
      final expiry = DateTime.fromMillisecondsSinceEpoch(exp * 1000);
      return DateTime.now().isAfter(expiry);
    } catch (e) {
      return true;
    }
  }

  /// Gọi API login
  Future<void> login(String email, String password) async {
    isLoading = true;
    error = null;
    notifyListeners();

    try {
      final response = await http.post(
        Uri.parse("$_baseUrl/user/login"),
        headers: {
          "accept": "*/*",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: {
          "email": email,
          "password": password,
        },
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        token = data['session']['access_token'];
        if (token != null) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('token', token!);
          isLoggedIn = true;
        } else {
          error = "Access Denied";
        }
      } else {
        error = "Sai tài khoản hoặc mật khẩu";
      }
    } catch (e) {
      error = "Lỗi đăng nhập: $e";
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  /// Gọi khi logout hoặc token hết hạn
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    token = null;
    isLoggedIn = false;
    notifyListeners();
  }

  /// Gọi API có token
  Future<http.Response> authorizedGet(String endpoint) async {
    final url = Uri.parse("$_baseUrl$endpoint");
    final headers = {
      "Content-Type": "application/json",
      "Authorization": "Bearer $token",
    };
    final res = await http.get(url, headers: headers);

    if (res.statusCode == 401) {
      // Token hết hạn → tự logout
      await logout();
    }

    return res;
  }
}
