import 'dart:convert';
import 'dart:io';
import 'package:di_cho_tien_loi/data/dto/user_dto.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http_parser/http_parser.dart';
import 'package:path/path.dart' as path;

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
    File? imageFile, // Nhận File thay vì URL string
    String? imageUrl, // Vẫn support URL nếu cần
  }) async {
    debugPrint(
      '🔄 updateUserInfo called with: username=$username, imageFile=${imageFile?.path}, imageUrl=$imageUrl',
    );

    try {
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

      final trimmedUsername = username.trim();
      if (trimmedUsername.isEmpty) {
        _error = 'Tên người dùng không được để trống';
        isLoading = false;
        notifyListeners();
        return;
      }

      // ✅ Tạo multipart request
      final url = Uri.parse('$_baseUrl/user');
      var request = http.MultipartRequest('PUT', url);

      // ✅ Thêm headers
      request.headers['Authorization'] = 'Bearer $token';

      // ✅ Thêm username field
      request.fields['username'] = trimmedUsername;

      // ✅ Thêm image file nếu có
      if (imageFile != null && await imageFile.exists()) {
        final fileName = path.basename(imageFile.path);
        final fileExtension = path.extension(fileName).toLowerCase();

        // Xác định content type dựa trên extension
        MediaType? contentType;
        if (fileExtension == '.jpg' || fileExtension == '.jpeg') {
          contentType = MediaType('image', 'jpeg');
        } else if (fileExtension == '.png') {
          contentType = MediaType('image', 'png');
        } else if (fileExtension == '.gif') {
          contentType = MediaType('image', 'gif');
        } else {
          contentType = MediaType('image', '*'); // Mặc định
        }

        final fileStream = http.ByteStream(imageFile.openRead());
        final fileLength = await imageFile.length();

        final multipartFile = http.MultipartFile(
          'image', // ✅ Tên field phải là 'image' theo API
          fileStream,
          fileLength,
          filename: fileName,
          contentType: contentType,
        );

        request.files.add(multipartFile);
      }
      // ✅ Hoặc thêm image URL nếu có (tùy chọn - server có thể không support cả 2)
      else if (imageUrl != null && imageUrl.trim().isNotEmpty) {
        request.fields['image'] = imageUrl.trim();
      }

      debugPrint('📦 Sending multipart/form-data request');
      debugPrint('🌐 URL: $url');
      debugPrint('📝 Fields: ${request.fields}');
      debugPrint('📎 Files: ${request.files.length} file(s)');

      // ✅ Gửi request
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      debugPrint('📡 Response status: ${response.statusCode}');
      debugPrint('📡 Response body: ${response.body}');

      if (response.statusCode == 200) {
        try {
          final data = jsonDecode(response.body);

          Map<String, dynamic> userJson;
          if (data.containsKey('user')) {
            userJson = data['user'];
          } else if (data.containsKey('data')) {
            userJson = data['data'];
          } else {
            userJson = data;
          }

          debugPrint('✅ API success, user data: $userJson');

          // ✅ Cập nhật user
          _user = UserDTO(
            username: userJson['username']?.toString() ?? trimmedUsername,
            name: userJson['name']?.toString() ?? _user?.name ?? '',
            email: userJson['email']?.toString() ?? _user?.email ?? '',
            password: '',
            birthdate:
                userJson['birthdate']?.toString() ?? _user?.birthdate ?? '',
            gender: userJson['gender']?.toString() ?? _user?.gender ?? '',
            photoUrl:
                userJson['image']?.toString() ??
                userJson['photoUrl']?.toString() ??
                userJson['avatar']?.toString(),
          );

          debugPrint('👤 User updated successfully');

          // ✅ Clear error nếu thành công
          _error = null;
        } catch (e) {
          debugPrint('❌ Error parsing response: $e');
          _error = 'Lỗi xử lý dữ liệu từ server';
        }
      } else {
        _error = 'Cập nhật thất bại (${response.statusCode})';

        try {
          final errorData = jsonDecode(response.body);
          if (errorData.containsKey('message')) {
            _error = errorData['message'];
          } else if (errorData.containsKey('error')) {
            _error = errorData['error'];
          }
        } catch (_) {
          // Không phải JSON
        }
      }
    } catch (e, stackTrace) {
      debugPrint('💥 Exception in updateUserInfo: $e');
      debugPrint('💥 Stack trace: $stackTrace');
      _error = 'Đã xảy ra lỗi: ${e.toString()}';
    } finally {
      isLoading = false;
      notifyListeners();
      debugPrint('🏁 updateUserInfo completed');
    }
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
