import 'package:di_cho_tien_loi/data/dto/food_dto.dart';

class FridgeItemDTO {
  final int id;
  final String? foodName;
  final String? imageUrl;
  final double quantity;
  final String unit;
  final DateTime? createdAt;
  final DateTime? expiryDate;
  final DateTime? updatedAt;
  final String? fridgeName;
  final int? fridgeId;
  final int? foodId;

  FridgeItemDTO({
    required this.id,
    this.foodName,
    this.imageUrl,
    required this.quantity,
    required this.unit,
    this.createdAt,
    this.expiryDate,
    this.updatedAt,
    this.fridgeName,
    this.fridgeId,
    this.foodId,
  });

  factory FridgeItemDTO.fromJson(Map<String, dynamic> json) {
    return FridgeItemDTO(
      id: json['id'],
      quantity: json['quantity'],
      unit: json['unit'] ?? '(không đơn vị)',
      createdAt: json['created_at'] ?? DateTime.now(),
      expiryDate: json['expiryDate'] != null
          ? DateTime.parse(json['expiryDate'])
          : null,
      updatedAt: json['created_at'] ?? DateTime.now(),
      fridgeName: json['fridgeName'] ?? '',
      fridgeId: json['fridge_id'] ?? '',
      foodId: json['food_id'] ?? '',
    );
  }
}
