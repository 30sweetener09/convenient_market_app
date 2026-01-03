import 'package:flutter/material.dart';
import 'dart:convert';
import 'dart:io';
import 'package:di_cho_tien_loi/data/dto/group_dto.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class GroupProvider extends ChangeNotifier {
  bool isLoading = false;
  String? _error;
  String? accessToken;
  List<GroupDTO>? _allGroups;
  GroupDTO? _groupById;

  static const String _baseUrl =
      "https://convenient-market-app.onrender.com/api";

  GroupProvider();

  List<GroupDTO>? get allGroups => _allGroups;
  GroupDTO? get groupById => _groupById;
  String? get error => _error;

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
      notifyListeners();
      return {};
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  Future<List<GroupDTO>> getAllGroups() async {
    isLoading = true;
    _error = null;
    notifyListeners();

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
            .map<GroupDTO>((json) => GroupDTO.fromJson(json as Map<String, dynamic>))
            .toList();

        // Lưu vào state của provider
        _allGroups = groups;
        debugPrint('\nUSER API RESPONSE: $_allGroups');
        isLoading = false;
        notifyListeners();
        return groups;

      } else if (response.statusCode == 401) {
        _error = 'Phiên đăng nhập đã hết hạn';
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
        return [];
      }
    } catch (e) {
      debugPrint('Error in getAllGroup: $e');
      _error = 'Lỗi kết nối: $e';
      isLoading = false;
      notifyListeners();
      return [];
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

  Future<void> getAllMemberOfGroup(String groupId) async {
    isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final headers = await _getHeaders();
      final url = Uri.parse('$_baseUrl/group/$groupId/members');

      final response = await http.get(url, headers: headers);
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        debugPrint('\nUSER API RESPONSE: $data');
      } else {
        throw Exception('Failed to load members: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error in getAllMemberOfGroup: $e');
      _error = 'Lỗi kết nối: $e';
      isLoading = false;
      notifyListeners();
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
        .map<GroupDTO>((item) => GroupDTO.fromSearchJson(item as Map<String, dynamic>))
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

  Future<void> createGroup() async {}

  Future<void> addMemberToGroup(String username) async {}

  Future<void> deleteMemberOfGroup(String username) async {}
}
