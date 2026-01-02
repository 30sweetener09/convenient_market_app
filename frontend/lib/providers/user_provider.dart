import 'dart:convert';
import 'package:di_cho_tien_loi/data/dto/user_dto.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class UserProvider extends ChangeNotifier {
  UserDTO? _user;
  bool isLoading = false;
  String? _error;
  String? accessToken;

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

  //Lấy thông tin user
  Future<void> fetchUserInfo() async {
    isLoading = true;
    _error = null;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');

    if (token == null) {
      _error = 'Chưa đăng nhập';
      isLoading = false;
      notifyListeners();
      return;
    }
    final url = Uri.parse('$_baseUrl/user');
    final response = await http.get(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final userJson = data['user'];
      debugPrint('\nUSER API RESPONSE: $userJson');
      _user = UserDTO(
        username: userJson['username'] ?? '',
        name: userJson['name'] ?? '',
        email: userJson['email'] ?? '',
        password: '', // Không lấy mật khẩu từ API
        birthdate: userJson['birthdate'] ?? '',
        gender: userJson['gender'] ?? '',
        photoUrl: userJson['photourl'],
      );
      debugPrint("\nĐịnh dạng dữ liệu ng dùng: ${_user?.email}");
    } else if (response.statusCode == 401) {
      _error = 'Phiên đăng nhập hết hạn';
    } else {
      _error = 'Lấy thông tin thất bại: ${response.body}';
    }

    isLoading = false;
    notifyListeners();
  }

  //Chỉnh sửa thông tin user
  Future<void> updateUserInfo({
    required String username,
    String? photoUrl,
  }) async {
    isLoading = true;
    _error = null;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');

    if (token == null) {
      _error = 'Chưa đăng nhập';
      isLoading = false;
      notifyListeners();
      return;
    }
      // ✅ Validate username
  if (username.trim().isEmpty) {
    _error = 'Tên người dùng không được để trống';
    isLoading = false;
    notifyListeners();
    return;
  }

  // ✅ Chỉ gửi field có giá trị
  final Map<String, dynamic> body = {
    'username': username.trim(),
  };

  if (photoUrl != null && photoUrl.trim().isNotEmpty) {
    body['photourl'] = photoUrl.trim();
  }

    final url = Uri.parse('$_baseUrl/user');
    final response = await http.put(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode(body),
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final userJson = data['user'];
      _user = UserDTO(
        username: userJson['username'] ?? '',
        name: userJson['name'] ?? '',
        email: userJson['email'] ?? '',
        password: '', // Không lấy mật khẩu từ API
        birthdate: userJson['birthdate'] ?? '',
        gender: userJson['gender'] ?? '',
        photoUrl: userJson['photourl'],
      );
    } else {
      _error = 'Cập nhật thất bại: ${response.body}';
    }
    isLoading = false;
    notifyListeners();
  }

  //Xoá tài khoản
  Future<void> delete() async {
    isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('access_token');

      if (token == null) {
        _error = 'Chưa đăng nhập';
        return;
      }

      final response = await http.delete(
        Uri.parse('$_baseUrl/user'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200 || response.statusCode == 204) {
        _user = null;
      } else if (response.statusCode == 401) {
        _error = 'Phiên đăng nhập hết hạn';
      } else {
        _error = 'Xoá tài khoản thất bại';
      }
    } catch (e) {
      _error = 'Không thể kết nối server';
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> changePassword(String newPassword) async {
    isLoading = true;
    _error = null;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');

    if (token == null) {
      _error = 'Chưa đăng nhập';
      isLoading = false;
      notifyListeners();
      return;
    }

    final url = Uri.parse('$_baseUrl/user/change-password');

    final response = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'newPassword': newPassword}),
    );

    if (response.statusCode != 200) {
      _error = 'Đổi mật khẩu thất bại: ${response.body}';
    }

    isLoading = false;
    notifyListeners();
  }
}
