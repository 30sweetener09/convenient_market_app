import 'dart:convert';
import 'package:di_cho_tien_loi/data/dto/fridge_dto.dart';
import 'package:di_cho_tien_loi/data/dto/fridge_item_dto.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class FridgeItemProvider extends ChangeNotifier {
  bool isLoading = false;
  String? _error;

  //FridgeDTO? _fridgeById;
  late FridgeItemDTO _item;
  List<FridgeItemDTO> _fridgeItems = [];
  bool isLoadingFridgeItems = false;

  FridgeItemProvider();

  static const String _baseUrl =
      "https://convenient-market-app.onrender.com/api";

  // ================= GETTERS =================
  //FridgeDTO? get fridgeById => _fridgeById;
  String? get error => _error;
  List<FridgeItemDTO> get fridgeItems => _fridgeItems;
  FridgeItemDTO get item => _item;

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

    return {'accept': 'application/json', 'Authorization': 'Bearer $token'};
  }

  // ================= FETCH ITEMS =================
  Future<void> fetchAllItems({int? fridgeId, int? groupId}) async {
    try {
      isLoadingFridgeItems = true;
      _error = null;
      notifyListeners();

      if (fridgeId == null && groupId == null) {
        throw Exception('Cần truyền fridgeId hoặc groupId');
      }

      final headers = await _getHeaders();

      // 🔥 build query params – fridgeId ưu tiên
      final queryParams = <String, String>{};

      if (fridgeId != null) {
        queryParams['fridgeId'] = fridgeId.toString();
      } else if (groupId != null) {
        queryParams['groupId'] = groupId.toString();
      }

      final uri = Uri.parse(
        '$_baseUrl/fridge/item/list',
      ).replace(queryParameters: queryParams);

      debugPrint('📦 Fetch fridge items: $uri');

      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List list = data['items'] ?? [];

        _fridgeItems = list.map<FridgeItemDTO>((e) {
          return FridgeItemDTO(
            id: e['id'],
            foodId: e['Food']['id'],
            foodName: e['Food']['name'],
            imageUrl: e['Food']['imageurl'],
            quantity: (e['quantity'] as num).toDouble(),
            unit: e['unit'],
            expiryDate: e['expiryDate'] != null
                ? DateTime.parse(e['expiryDate'])
                : null,
            fridgeName: e['fridgeName'],
          );
        }).toList();
      } else {
        final data = jsonDecode(response.body);
        _error = data['resultMessage']?['vn'] ?? 'Lấy danh sách thất bại';
        _fridgeItems = [];
      }
    } catch (e) {
      _error = e.toString();
      _fridgeItems = [];
    } finally {
      isLoadingFridgeItems = false;
      notifyListeners();
    }
  }

  // ================= CREATE ITEM =================
  Future<FridgeItemDTO?> createItem(
    int fridgeId,
    String foodName,
    double quantity,
    String unit,
    int useWithinDays,
  ) async {
    try {
      isLoading = true;
      _error = null;

      final headers = await _getHeaders();
      headers['Content-Type'] = 'application/json';
      final uri = Uri.parse('$_baseUrl/fridge/item/create');

      debugPrint(uri.toString());

      final response = await http.post(
        uri,
        headers: headers,
        body: jsonEncode({
          'fridgeId': fridgeId,
          'foodName': foodName,
          'quantity': quantity,
          'unit': unit,
          'useWithinDays': useWithinDays,
        }),
      );
      debugPrint('Lấy được trả được $response');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body)['newItem'];
        //final List list = data['newItem'];

        final newItem = FridgeItemDTO(
          id: int.parse(data['id']),
          quantity: data['quantity'],
          unit: unit,
          foodId: data['food_id'],
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
          expiryDate: data['expirydate'],
          fridgeId: data['fridge_id'],
        );
        _fridgeItems.insert(0, newItem);
        notifyListeners();
        return newItem;
      } else {
        throw Exception('Lỗi kết nối');
      }
    } catch (e) {
      _error = e.toString();
      return null;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }
  /*
  // ================= UPDATE ITEM =================
  Future<FridgeItemDTO?> updateItem(
    int itemId,
    String foodName,
    double quantity,
    String unit,
    int useWithinDays,
  ) async {
    try {
      isLoading = true;
      _error = null;

      final headers = await _getHeaders();
      headers['Content-Type'] = 'application/json';
      final uri = Uri.parse('$_baseUrl/fridge/item/create');

      debugPrint(uri.toString());

      final response = await http.put(
        uri,
        headers: headers,
        body: jsonEncode({
          'fridgeId': fridgeId,
          'foodName': foodName,
          'quantity': quantity,
          'unit': unit,
          'useWithinDays': useWithinDays,
        }),
      );
      debugPrint('Lấy được trả được $response');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body)['newItem'];
        //final List list = data['newItem'];

        final newItem = FridgeItemDTO(
          id: int.parse(data['id']),
          quantity: data['quantity'],
          unit: unit,
          foodId: data['food_id'],
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
          expiryDate: data['expirydate'],
          fridgeId: data['fridge_id'],
        );
        _fridgeItems.insert(0, newItem);
        return newItem;
      } else {
        throw Exception('Lỗi kết nối');
      }
    } catch (e) {
      _error = e.toString();
      return null;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }*/

  // ================= DELETE ITEM =================
  Future<bool> deleteItem(int itemId, String foodName, int fridgeId) async {
    try {
      isLoading = true;
      _error = null;

      final headers = await _getHeaders();
      headers['Content-Type'] = 'application/json';
      final uri = Uri.parse('$_baseUrl/fridge/item/delete');

      debugPrint(uri.toString());

      final response = await http.delete(
        uri,
        headers: headers,
        body: jsonEncode({
          'itemId': itemId,
          'foodName': foodName,
          'fridgeId': fridgeId,
        }),
      );
      debugPrint('Lấy được trả được $response');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _fridgeItems.removeWhere((item) => item.id == itemId);
        notifyListeners();

        return true;
      } else {
        final data = jsonDecode(response.body);
        _error = data['resultMessage']?['vn'] ?? 'Xóa thất bại';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  // ================= SEARCH ITEM =================
  Future<void> searchItem(String foodName) async {
    try {
      isLoadingFridgeItems = true;
      _error = null;
      notifyListeners();

      final headers = await _getHeaders();

      // ⚠️ encode để tránh lỗi tiếng Việt + dấu cách
      final encodedName = Uri.encodeComponent(foodName.trim());

      final uri = Uri.parse('$_baseUrl/fridge/item/search/$encodedName');

      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        final List list = data['items'] ?? [];

        _fridgeItems = list.map<FridgeItemDTO>((e) {
          return FridgeItemDTO(
            id: e['id'],
            foodName: e['food']['name'],
            imageUrl: e['food']['imageurl'],
            quantity: e['quantity'],
            unit: e['unit'],
            expiryDate: e['expirydate'] != null
                ? DateTime.parse(e['expirydate'])
                : null,
            fridgeId: e['fridge']['id'],
            fridgeName: e['fridge']['name'],
          );
        }).toList();
      } else {
        final data = jsonDecode(response.body);
        _error = data['resultMessage']?['vn'] ?? 'Tìm kiếm thất bại';
        _fridgeItems = [];
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
