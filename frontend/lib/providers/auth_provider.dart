import 'dart:convert';
import 'package:di_cho_tien_loi/data/dto/user_dto.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class AuthProvider extends ChangeNotifier {
  bool isLoggedIn = false;
  bool isLoading = false;
  String? _error;
  String? token;

  static const String _baseUrl =
      "https://convenient-market-app.onrender.com/api";

  AuthProvider() {
    _loadToken();
  }
  String? get error => _error;

  // Thêm method reset error
  void resetError() {
    _error = null;
    notifyListeners();
  }

  // Load token từ local khi app khởi động
  Future<void> _loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    token = prefs.getString('access_token');

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
      final payload = jsonDecode(
        utf8.decode(base64Url.decode(base64Url.normalize(parts[1]))),
      );
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
    _error = null;

    try {
      final response = await http.post(
        Uri.parse("$_baseUrl/user/login"),
        headers: {
          "accept": "*/*",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: {"email": email, "password": password},
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        token = data['session']['access_token'];
        if (token != null) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('access_token', token!);
          isLoggedIn = true;
        } else {
          _error = "Access Denied";
        }
      } else {
        _error = "Sai tài khoản hoặc mật khẩu";
      }
    } catch (e) {
      _error = "Lỗi đăng nhập: $e";
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  /// Gọi khi logout hoặc token hết hạn
  Future<void> logout() async {
    isLoading = true;
    try {
      // 1. Gọi API logout trên server
      final headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      };
      
      final url = Uri.parse('$_baseUrl/user/logout');
      final response = await http.post(url, headers: headers);
      
      if (response.statusCode == 200) {
        debugPrint('Logout thành công trên server');
      } else {
        debugPrint('Logout API error: ${response.statusCode}');
        // Vẫn tiếp tục xóa token trên client dù server có lỗi
      }
    } catch (e) {
      debugPrint('Error calling logout API: $e');
      // Vẫn tiếp tục xóa token trên client nếu có lỗi kết nối
    } finally {
      // 2. Luôn luôn xóa token trên client
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('token');
      isLoading = false;
      token = null;
      isLoggedIn = false;
      notifyListeners();
    }
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

  /// Gọi API đăng ký
  Future<bool> register(UserDTO userdto) async {
    isLoading = true;
    _error = null;

    bool success = false;

    try {
      /*
          debugPrint("=== REGISTER REQUEST ===");
          debugPrint("Name: ${userdto.username}");
          debugPrint("Email: ${userdto.email}");
          debugPrint("Password: ${userdto.password.length} chars");
          debugPrint("DOB: ${userdto.birthdate}");
          debugPrint("Gender: ${userdto.gender}");
          debugPrint("========================"); */
      debugPrint("Registering user: ${userdto.email}"); // Debug

      // Check dob format
      DateTime? dob;
      try {
        dob = DateTime.parse(userdto.birthdate);
      } catch (e) {
        _error = "Ngày sinh không hợp lệ";
        isLoading = false;
        notifyListeners();
        return false;
      }

      final response = await http.post(
        Uri.parse("$_baseUrl/user/"),
        headers: {
          "accept": "*/*",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: {
          "username": userdto.username,
          "email": userdto.email,
          "password": userdto.password,
          "birthdate": userdto.birthdate,
          "gender": userdto.gender,
        },
      );

      debugPrint("Register response status: ${response.statusCode}");
      debugPrint("Register response body: ${response.body}");

      if (response.statusCode == 200 || response.statusCode == 201) {
        try {
          final data = jsonDecode(response.body);
          token = data['session']?['access_token'];

          if (token != null) {
            final prefs = await SharedPreferences.getInstance();
            await prefs.setString('token', token!);
            isLoggedIn = true;
          }
          success = true;
          _error = null;
        } catch (e) {
          debugPrint("Error parsing response: $e");
          _error = "Lỗi xử lý phản hồi từ máy chủ";
        }

        //lỗi 400 bad request
      } else if (response.statusCode == 400) {
        try {
          final data = jsonDecode(response.body);
          _error = data['error'] ?? data['message'] ?? "Dữ liệu không hợp lệ";
          // Check for specific validation errors
          if (data['errors'] != null) {
            final errors = Map<String, dynamic>.from(data['errors']);
            if (errors.containsKey('email')) {
              _error = "Email đã được sử dụng hoặc không hợp lệ";
            } else if (errors.containsKey('password')) {
              _error = "Mật khẩu không đủ mạnh";
            }
          }
        } catch (e) {
          _error = "Dữ liệu không hợp lệ";
        }
      } else if (response.statusCode == 409) {
        _error = "Email đã được đăng ký";
      } else if (response.statusCode == 422) {
        _error = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin";
      } else {
        _error = "Đăng ký thất bại (Mã lỗi: ${response.statusCode})";
      }
    } catch (e) {
      debugPrint("Unexpected error in register: $e");
      _error = "Lỗi không xác định: $e";
    } finally {
      isLoading = false;
      notifyListeners();
    }

    return success;
  }

  //Gọi API gửi mã xác minh
  Future<bool> sendVerificationEmail(String email) async {
    isLoading = true;
    _error = null;
    notifyListeners();

    bool success = false;

    try {
      final response = await http.post(
        Uri.parse("$_baseUrl/user/send-verification-code"),
        headers: {
          "accept": "*/*",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: {"email": email},
      );

      if (response.statusCode == 200) {
        success = true;
        debugPrint("Verification email sent to $email");
      } else {
        _error = "Gửi email xác minh thất bại";
      }
    } catch (e) {
      _error = "Lỗi gửi email xác minh: $e";
    } finally {
      isLoading = false;
      notifyListeners();
    }
    return success;
  }
  Future<bool> verifyCode(String email, String code) async {
    isLoading = true;
    _error = null;
    notifyListeners();

    bool success = false;

    try {
      final response = await http.post(
        Uri.parse("$_baseUrl/user/verify-code"),
        headers: {
          "accept": "*/*",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: {"email": email, "code": code},
      );

      if (response.statusCode == 200) {
        success = true;
        debugPrint("Email verified successfully");
      } else {
        _error = "Xác minh email thất bại (Mã lỗi: ${response.statusCode})";
      }
    } catch (e) {
      _error = "Lỗi xác minh email: $e";
    } finally {
      isLoading = false;
      notifyListeners();
    }

    return success;
  }

  Future<bool> verifyEmail (String verifyToken) async {
    isLoading = true;
    _error = null;
    notifyListeners();

    bool success = false;

    try {
      final response = await http.post(
        Uri.parse("$_baseUrl/user/verify-email"),
        headers: {
          "Content-Type": "application/json",
        },
        body: jsonEncode({
        "token": verifyToken, // ✅ QUAN TRỌNG
      }),
      );

      if (response.statusCode == 200) {
        success = true;
        debugPrint("Email verified successfully");
      } else {
        _error = "Xác minh email thất bại (Mã lỗi: ${response.statusCode})";
      }
    } catch (e) {
      _error = "Lỗi xác minh email: $e";
    } finally {
      isLoading = false;
      notifyListeners();
    }

    return success;
  }

  Future<bool> changePassword (String newPassword) async {
    isLoading = true;
    _error = null;
    notifyListeners();

    bool success = false;

    try {
      final response = await http.post(
      Uri.parse("$_baseUrl/user/change-password"),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token", // Nếu API yêu cầu token từ bước Verify OTP
      },
      body: jsonEncode({"newPassword": newPassword}),
    );

      if (response.statusCode == 200) {
        success = true;
        debugPrint("Password changed successfully");
      } else {
        _error = "Đổi mật khẩu thất bại (Mã lỗi: ${response.statusCode})";
      }
    } catch (e) {
      _error = "Lỗi đổi mật khẩu: $e";
    } finally {
      isLoading = false;
      notifyListeners();
    }

    return success;
  }
}
