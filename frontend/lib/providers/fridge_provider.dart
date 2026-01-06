import 'dart:convert';
import 'package:di_cho_tien_loi/data/dto/fridge_dto.dart';
import 'package:di_cho_tien_loi/data/dto/fridge_item_dto.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class FridgeProvider extends ChangeNotifier {
  bool isLoading = false;
  String? _error;

  List<FridgeDTO> _allFridges = [];
  FridgeDTO? _fridgeById;
  List<FridgeItemDTO> _fridgeItems = [];
  bool isLoadingFridgeItems = false;

  static const String _baseUrl =
      "https://convenient-market-app.onrender.com/api";

  // ================= GETTERS =================
  List<FridgeDTO> get allFridges => _allFridges;
  FridgeDTO? get fridgeById => _fridgeById;
  String? get error => _error;
  List<FridgeItemDTO> get fridgeItems => _fridgeItems;

  // ================= RESET =================
  void resetError() {
    _error = null;
    notifyListeners();
  }

  // ================= HEADERS =================
  Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');

    if (token == null || token.isEmpty) {
      throw Exception('Chưa đăng nhập');
    }

    return {
      'accept': 'application/json',
      'content-type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  // ================= FETCH BY GROUP =================
  Future<void> fetchFridgesByGroupId(int groupId) async {
    try {
      isLoading = true;
      _error = null;
      notifyListeners();

      final headers = await _getHeaders();
      final uri = Uri.parse(
        '$_baseUrl/fridge',
      ).replace(queryParameters: {'groupId': groupId.toString()});
      debugPrint(uri.toString());

      final response = await http.get(uri, headers: headers);
      debugPrint('Lấy được trả được $response');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List list = data['fridges'];

        _allFridges = list
            .map<FridgeDTO>((e) => FridgeDTO.fromJson(e))
            .toList();
        debugPrint('Lấy được fridges $_allFridges');
      } else {
        throw Exception('Không thể lấy danh sách tủ lạnh');
      }
    } catch (e) {
      _error = e.toString();
      _allFridges = [];
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  // ================= FETCH BY ID =================
  Future<void> fetchFridgeById(int fridgeId) async {
    try {
      isLoading = true;
      _error = null;
      notifyListeners();

      final headers = await _getHeaders();
      final uri = Uri.parse('$_baseUrl/fridge/$fridgeId');

      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _fridgeById = FridgeDTO.fromJson(data['fridge']);
      } else {
        throw Exception('Lấy chi tiết tủ thất bại');
      }
    } catch (e) {
      _error = e.toString();
      _fridgeById = null;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  // ================= CREATE =================
  Future<FridgeDTO?> createFridge({
    required String name,
    required int groupId,
    String? description,
  }) async {
    try {
      isLoading = true;
      _error = null;
      notifyListeners();

      final headers = await _getHeaders();
      final uri = Uri.parse('$_baseUrl/fridge');

      final response = await http.post(
        uri,
        headers: headers,
        body: jsonEncode({
          'name': name,
          'groupId': groupId,
          'description': description,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        final fridge = FridgeDTO.fromJson(data['fridge']);

        // cập nhật state luôn
        _allFridges.insert(0, fridge);

        return fridge;
      } else {
        throw Exception('Tạo tủ thất bại');
      }
    } catch (e) {
      _error = e.toString();
      return null;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchFridgeItems({
    required int fridgeId,
    required int groupId,
  }) async {
    try {
      isLoadingFridgeItems = true;
      _error = null;
      notifyListeners();

      final headers = await _getHeaders();

      final uri = Uri.parse('$_baseUrl/fridge/item/list').replace(
        queryParameters: {
          'fridgeId': fridgeId.toString(),
          'groupId': groupId.toString(),
        },
      );

      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List list = data['items'];

        _fridgeItems = list
            .map<FridgeItemDTO>((e) => FridgeItemDTO.fromJson(e))
            .toList();
      } else {
        throw Exception('Không thể lấy danh sách đồ trong tủ');
      }
    } catch (e) {
      _error = e.toString();
      _fridgeItems = [];
    } finally {
      isLoadingFridgeItems = false;
      notifyListeners();
    }
  }
}
