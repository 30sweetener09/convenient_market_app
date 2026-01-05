import 'package:di_cho_tien_loi/data/dto/group_member_dto.dart';
import 'package:di_cho_tien_loi/data/models/group_model.dart';
import 'package:flutter/material.dart';
import 'dart:convert';
import 'dart:io';
import 'package:di_cho_tien_loi/data/dto/group_dto.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:path/path.dart' as path;
import 'package:http_parser/http_parser.dart';

class GroupProvider extends ChangeNotifier {
  bool isLoading = false;
  String? _error;
  String? accessToken;
  List<GroupDTO>? _allGroups = [];
  GroupDTO? _groupById;
  List<MemberDTO> _allMembers = [];
  MemberDTO? _member;

  static const String _baseUrl =
      "https://convenient-market-app.onrender.com/api";

  GroupProvider();

  List<GroupDTO>? get allGroups => _allGroups;
  GroupDTO? get groupById => _groupById;
  String? get error => _error;

  List<MemberDTO>? get allMembers => _allMembers;
  MemberDTO? get member => _member;

  // Thêm method reset error
  void resetError() {
    _error = null;
    notifyListeners();
  }

  Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');

    if (token == null) {
      _error = 'Chưa đăng nhập';
      isLoading = false;
      return {};
    }

    return {'accept': 'application/json', 'Authorization': 'Bearer $token'};
  }

  Future<List<GroupDTO>> getAllGroups() async {
    isLoading = true;
    _error = null;

    try {
      final headers = await _getHeaders();
      final url = Uri.parse('$_baseUrl/group');
      final response = await http.get(url, headers: headers);
      debugPrint('Group API Response Status: ${response.statusCode}');
      debugPrint('Group API Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        debugPrint('\nUSER API RESPONSE: $data');

        // Parse danh sách group
        final List<GroupDTO> groups = data
            .map<GroupDTO>(
              (json) => GroupDTO.fromJson(json as Map<String, dynamic>),
            )
            .toList();

        // Lưu vào state của provider
        _allGroups = groups;
        debugPrint('\nUSER API RESPONSE: $_allGroups');
        isLoading = false;
        notifyListeners();
        return groups;
      } else if (response.statusCode == 401) {
        _error = 'Phiên đăng nhập đã hết hạn';
        _allGroups = [];
        isLoading = false;
        notifyListeners();
        return [];
      } else {
        final errorData = jsonDecode(response.body);
        _error =
            errorData['message'] ??
            'Lỗi không xác định: ${response.statusCode}';
        isLoading = false;
        notifyListeners();
        return _allGroups!;
      }
    } catch (e) {
      debugPrint('Error in getAllGroup: $e');
      _error = 'Lỗi kết nối: $e';
      isLoading = false;
      notifyListeners();
      return _allGroups!;
    }
  }

  Future<GroupDTO> getGroupById(String groupId) async {
    isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final headers = await _getHeaders();
      final url = Uri.parse('$_baseUrl/group/$groupId');

      final response = await http.get(url, headers: headers);

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(response.body);

        isLoading = false;
        notifyListeners();
        return GroupDTO.fromJson(data);
      } else {
        throw Exception('Failed to load group: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error in getGroupbyID: $e');
      _error = 'Lỗi kết nối: $e';
      isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<List<GroupDTO>> searchGroups(String query) async {
    isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final headers = await _getHeaders();
      final url = Uri.parse('$_baseUrl/group/search?q=$query');

      final response = await http.get(url, headers: headers);

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        final List<GroupDTO> groups = data
            .map<GroupDTO>(
              (item) => GroupDTO.fromSearchJson(item as Map<String, dynamic>),
            )
            .toList();
        isLoading = false;
        notifyListeners();

        return groups;
      } else {
        throw Exception('Failed to search groups: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error in searchGroups: $e');
      _error = 'Lỗi kết nối: $e';
      isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<GroupDTO> createGroup({
    required String name,
    required String description,
    File? imageFile,
  }) async {
    try {
      isLoading = true;
      _error = null;
      notifyListeners();
      final headers = await _getHeaders();

      // 1. KIỂM TRA TOKEN
      if (!headers.containsKey('Authorization') ||
          headers['Authorization']!.isEmpty) {
        throw Exception('Chưa đăng nhập. Vui lòng đăng nhập lại.');
      }

      // 2. TẠO MULTIPART REQUEST
      final url = Uri.parse('$_baseUrl/group');
      var request = http.MultipartRequest('POST', url);

      //Thêm headers
      request.headers.addAll({
        'accept': '*/*',
        'Authorization': headers['Authorization']!,
      });

      // Thêm fields
      debugPrint('📝 Text fields:');
      debugPrint('   - name: "$name"');
      debugPrint('   - description: "$description"');

      request.fields['name'] = name;
      request.fields['description'] = description;

      // Thêm imageFile nếu có
      if (imageFile != null) {
        final fileName = path.basename(imageFile.path);
        final fileExtension = path.extension(fileName).toLowerCase();
        debugPrint('🖼️ Processing image file...');
        debugPrint('   Path: ${imageFile.path}');
        debugPrint('   Exists: ${imageFile.existsSync()}');

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
        if (fileLength > 5 * 1024 * 1024) {
          // 10MB limit
          throw Exception('File ảnh quá lớn (>5MB). Vui lòng chọn ảnh nhỏ hơn');
        }
        final multipartFile = http.MultipartFile(
          'file',
          fileStream,
          fileLength,
          filename: fileName,
          contentType: contentType,
        );
        request.files.add(multipartFile);
      } else {
        debugPrint('📭 No image file provided - creating group without image');
      }

      // 6. LOG REQUEST
      debugPrint('📦 Request summary:');
      debugPrint('   URL: $url');
      debugPrint('   Fields count: ${request.fields}');
      debugPrint('   Files count: ${request.files.length}');
      if (request.files.isNotEmpty) {
        debugPrint('   File field: ${request.files.first.field}');
        debugPrint('   File name: ${request.files.first.filename}');
      }

      // 7. GỬI REQUEST
      debugPrint('🚀 Sending request...');
      final streamedResponse = await request.send().timeout(
        Duration(seconds: imageFile != null ? 45 : 25),
        onTimeout: () {
          throw Exception('Request timeout. Server took too long to respond.');
        },
      );

      final response = await http.Response.fromStream(streamedResponse);

      debugPrint('📥 Response received:');
      debugPrint('   Status: ${response.statusCode}');
      debugPrint('   Body length: ${response.body.length} chars');

      // 8. XỬ LÝ RESPONSE
      if (response.statusCode == 200 || response.statusCode == 201) {
        try {
          final data = json.decode(response.body);
          debugPrint('🎉 Group created successfully!');
          debugPrint('   Group ID: ${data['id']}');
          debugPrint('   Group name: ${data['name']}');
          debugPrint('   Group name: ${data['imageurl']} ');

          debugPrint('🎉 Group created successfully!');

          final newGroup = GroupDTO(
            id: data['id'].toString(),
            name: data['name'] as String,
            description: data['description'] as String,
            createdAt: DateTime.parse(data['created_at'] as String),
            imageurl: data['imageurl'],
            role: "groupAdmin",
          );

          debugPrint('Đã tạo được newGroup');

          // Cập nhật danh sách groups
          _allGroups ??= [];
          _allGroups!.insert(0, newGroup);

          isLoading = false;
          notifyListeners();

          debugPrint('📊 Total groups in cache: ${_allGroups!.length}');
          return newGroup;
        } catch (e) {
          debugPrint('❌ Error parsing response: $e');
          debugPrint('Raw response: ${response.body}');
          throw Exception('Lỗi xử lý dữ liệu từ server. Vui lòng thử lại.');
        }
      } else {
        // Xử lý các lỗi HTTP khác
        debugPrint('❌ HTTP Error ${response.statusCode}');
        debugPrint('Error body: ${response.body}');

        String errorMessage = 'Lỗi tạo nhóm (${response.statusCode})';

        try {
          final errorData = json.decode(response.body);
          if (errorData['message'] != null) {
            errorMessage = errorData['message'];
          } else if (errorData['error'] != null) {
            errorMessage = errorData['error'];
          }
        } catch (_) {
          // Không parse được JSON error
        }

        // Phân tích lỗi cụ thể
        if (response.statusCode == 400) {
          if (errorMessage.contains('file') || errorMessage.contains('image')) {
            errorMessage = 'Lỗi upload ảnh: $errorMessage';
          } else if (errorMessage.contains('name')) {
            errorMessage = 'Tên nhóm không hợp lệ: $errorMessage';
          } else if (errorMessage.contains('description')) {
            errorMessage = 'Mô tả không hợp lệ: $errorMessage';
          }
        } else if (response.statusCode == 401) {
          errorMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
        } else if (response.statusCode == 413) {
          errorMessage = 'File ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 10MB.';
        } else if (response.statusCode == 415) {
          errorMessage =
              'Định dạng file không được hỗ trợ. Vui lòng chọn ảnh JPG, PNG, GIF.';
        } else if (response.statusCode >= 500) {
          errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
        }

        throw Exception(errorMessage);
      }
    } catch (e, stackTrace) {
      debugPrint('💥 CREATE GROUP EXCEPTION:');
      debugPrint('   Error: $e');
      debugPrint('   Stack trace: $stackTrace');

      _error = e.toString();
      isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<GroupDTO?> updateGroup({
    required String id,
    required String name,
    required String description,
    File? imageFile,
  }) async {
    try {
      isLoading = true;
      _error = null;
      notifyListeners();

      final headers = await _getHeaders();

      if (!headers.containsKey('Authorization') ||
          headers['Authorization']!.isEmpty) {
        throw Exception('Chưa đăng nhập. Vui lòng đăng nhập lại.');
      }

      final url = Uri.parse('$_baseUrl/group/${int.parse(id)}');
      var request = http.MultipartRequest('PUT', url);

      //Thêm headers
      request.headers.addAll({
        'accept': '*/*',
        'Authorization': headers['Authorization']!,
        'Content-Type': 'multipart/form-data',
      });

      // Thêm fields
      debugPrint('📝 Text fields:');
      debugPrint('   - name: "$name"');
      debugPrint('   - description: "$description"');

      request.fields['name'] = name;
      request.fields['description'] = description;

      // Thêm imageFile nếu có
      if (imageFile != null && await imageFile.exists()) {
        final fileName = path.basename(imageFile.path);
        final fileExtension = path.extension(fileName).toLowerCase();
        debugPrint('🖼️ Processing image file...');
        debugPrint('   Path: ${imageFile.path}');
        debugPrint('   Exists: ${imageFile.existsSync()}');

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
        if (fileLength > 5 * 1024 * 1024) {
          // 10MB limit
          throw Exception('File ảnh quá lớn (>5MB). Vui lòng chọn ảnh nhỏ hơn');
        }
        final multipartFile = http.MultipartFile(
          'file',
          fileStream,
          fileLength,
          filename: fileName,
          contentType: contentType,
        );
        request.files.add(multipartFile);
      } else {
        debugPrint('📭 No image file provided - creating group without image');
      }

      // 6. LOG REQUEST
      debugPrint('📦 Request summary:');
      debugPrint('   URL: $url');
      debugPrint('   Fields count: ${request.fields}');
      debugPrint('   Files count: ${request.files.length}');

      // 7. GỬI REQUEST
      debugPrint('🚀 Sending request...');
      final streamedResponse = await request.send().timeout(
        Duration(seconds: imageFile != null ? 45 : 25),
        onTimeout: () {
          throw Exception('Request timeout. Server took too long to respond.');
        },
      );

      final response = await http.Response.fromStream(streamedResponse);

      debugPrint('📥 Response received:');
      debugPrint('   Status: ${response.statusCode}');
      debugPrint('   Body length: ${response.body.length} chars');

      // 8. XỬ LÝ RESPONSE
      if (response.statusCode == 200 || response.statusCode == 201) {
        try {
          final data = json.decode(response.body);
          debugPrint('🎉 Lấy data thành công successfully!');
          debugPrint('   Group ID: ${data['id']}');
          debugPrint('   Group name: ${data['name']}');
          debugPrint('   Group name: ${data['imageurl']}');

          final updatedGroup = GroupDTO(
            id: data['id'].toString(),
            name: data['name'] as String,
            description: data['description'] as String,
            createdAt: DateTime.parse(data['created_at'] as String),
            imageurl: data['imageurl'],
            role: "groupAdmin",
          );

          debugPrint('Đã tạo được newGroup');
          if (_allGroups != null) {
            final index = _allGroups!.indexWhere((g) => g.id == id);
            if (index != -1) {
              _allGroups![index] = updatedGroup;
            }
          }
          _groupById = updatedGroup;

          isLoading = false;
          notifyListeners();

          return _groupById;
        } catch (e) {
          debugPrint('❌ Error parsing response: $e');
          debugPrint('Raw response: ${response.body}');
          throw Exception('Lỗi xử lý dữ liệu từ server. Vui lòng thử lại.');
        }
      } else {
        // Xử lý các lỗi HTTP khác
        debugPrint('❌ HTTP Error ${response.statusCode}');
        debugPrint('Error body: ${response.body}');

        String errorMessage = 'Lỗi tạo nhóm (${response.statusCode})';

        try {
          final errorData = json.decode(response.body);
          if (errorData['message'] != null) {
            errorMessage = errorData['message'];
          } else if (errorData['error'] != null) {
            errorMessage = errorData['error'];
          }
        } catch (_) {
          // Không parse được JSON error
        }

        // Phân tích lỗi cụ thể
        if (response.statusCode == 400) {
          if (errorMessage.contains('file') || errorMessage.contains('image')) {
            errorMessage = 'Lỗi upload ảnh: $errorMessage';
          } else if (errorMessage.contains('name')) {
            errorMessage = 'Tên nhóm không hợp lệ: $errorMessage';
          } else if (errorMessage.contains('description')) {
            errorMessage = 'Mô tả không hợp lệ: $errorMessage';
          }
        } else if (response.statusCode == 401) {
          errorMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
        } else if (response.statusCode == 413) {
          errorMessage = 'File ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 10MB.';
        } else if (response.statusCode == 415) {
          errorMessage =
              'Định dạng file không được hỗ trợ. Vui lòng chọn ảnh JPG, PNG, GIF.';
        } else if (response.statusCode >= 500) {
          errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
        }

        throw Exception(errorMessage);
      }
    } catch (e, stackTrace) {
      debugPrint('💥 UPDATE GROUP EXCEPTION:');
      debugPrint('   Error: $e');
      debugPrint('   Stack trace: $stackTrace');

      _error = e.toString();
      isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<bool> deleteGroup({required String id}) async {
    try {
      isLoading = true;
      _error = null;
      notifyListeners();

      final headers = await _getHeaders();

      if (!headers.containsKey('Authorization') ||
          headers['Authorization']!.isEmpty) {
        throw Exception('Chưa đăng nhập. Vui lòng đăng nhập lại.');
      }
      final groupId = int.parse(id);
      final url = Uri.parse('$_baseUrl/group/$groupId');
      var request = http.MultipartRequest('DELETE', url);

      //Thêm headers
      request.headers.addAll({
        'accept': '*/*',
        'Authorization': headers['Authorization']!,
      });

      debugPrint('🚀 Sending request...');
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      debugPrint('Response status: ${response.statusCode}');
      debugPrint('Response body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        //xử lí phần xoá group
        _allGroups!.removeWhere((group) => group.id == id);
        debugPrint('✅ Group deleted successfully: $id');
        isLoading = false;
        notifyListeners();
        return true;
      } else if (response.statusCode == 400 || response.statusCode == 401) {
        _error = 'Yêu cầu không hợp lệ';
      } else if (response.statusCode == 401) {
        _error = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
      } else if (response.statusCode == 404) {
        _error = 'Không tìm thấy nhóm';
      } else if (response.statusCode == 409) {
        _error = 'Không thể xóa nhóm đang có thành viên hoặc dữ liệu liên quan';
      } else if (response.statusCode >= 500) {
        _error = 'Lỗi máy chủ. Vui lòng thử lại sau.';
      }
      return false;
    } catch (e, stackTrace) {
      debugPrint('💥 UPDATE GROUP EXCEPTION:');
      debugPrint('   Error: $e');
      debugPrint('   Stack trace: $stackTrace');
      _error = e.toString();
      isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<List<MemberDTO>> getAllMembersOfGroup({
    required String groupId,
  }) async {
    try {
      isLoading = true;
      _error = null;
      notifyListeners();

      final headers = await _getHeaders();

      if (!headers.containsKey('Authorization') ||
          headers['Authorization']!.isEmpty) {
        throw Exception('Chưa đăng nhập. Vui lòng đăng nhập lại.');
      }

      final gId = int.parse(groupId);
      final url = Uri.parse('$_baseUrl/group/$gId/members');

      final response = await http.get(
        url,
        headers: {
          'accept': '*/*',
          'Authorization': headers['Authorization']!,
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);

        final members = data.map<MemberDTO>((json) {
          final user = json['users'];

          return MemberDTO(
            id: user['id'], // String
            username: user['username'],
            email: user['email'],
            imageurl: user['imageurl'],
            roleInGroup: json['role_in_group'],
            joinedAt: DateTime.parse(json['joined_at']),
          );
        }).toList();

        _allMembers = members;
        isLoading = false;
        notifyListeners();
        return members;
      }

      if (response.statusCode == 401) {
        _error = 'Phiên đăng nhập đã hết hạn';
        _allMembers = [];
      } else {
        final errorData = jsonDecode(response.body);
        _error =
            errorData['message'] ??
                'Lỗi không xác định: ${response.statusCode}';
      }

      isLoading = false;
      notifyListeners();
      return _allMembers;
    } catch (e) {
      debugPrint('Error in getAllMembers: $e');
      _error = 'Lỗi kết nối: $e';
      isLoading = false;
      notifyListeners();
      return _allMembers;
    }
  }


  Future<MemberDTO?> addMemberToGroup(String groupId, String email) async {
    try {
      isLoading = true;
      _error = null;
      notifyListeners();

      final headers = await _getHeaders();

      if (!headers.containsKey('Authorization') ||
          headers['Authorization']!.isEmpty) {
        throw Exception('Chưa đăng nhập. Vui lòng đăng nhập lại.');
      }
      final gId = int.parse(groupId);
      final url = Uri.parse('$_baseUrl/group/$gId/members');
      var request = http.MultipartRequest('POST', url);

      //Thêm headers
      request.headers.addAll({
        'accept': '*/*',
        'Authorization': headers['Authorization']!,
      });

      request.fields['email'] = email;
      request.fields['role'] = "groupMember";

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        final newMember = MemberDTO(
          id: data['id'].toString(),
          username: data['name'] as String,
          email: data['description'] as String,
          joinedAt: DateTime.parse(data['created_at'] as String),
          imageurl: data['imageurl'],
          roleInGroup: "groupMember",
        );

        _allMembers.insert(0, newMember);
        isLoading = false;
        notifyListeners();
        return newMember;
      }
    } catch (e) {
      debugPrint('Error in addMember: $e');
      _error = 'Lỗi kết nối: $e';
      isLoading = false;
      notifyListeners();
      return null;
    }
    return null;
  }

  Future<void> deleteMemberOfGroup(String username) async {}
}
