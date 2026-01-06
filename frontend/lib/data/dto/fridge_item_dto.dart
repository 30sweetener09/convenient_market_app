
import 'package:di_cho_tien_loi/data/dto/food_dto.dart';

class FridgeItemDTO {
  final int id;
  final int quantity;
  final String unit;
  final DateTime? expiryDate;
  final String fridgeName;
  final FoodDTO food;

  FridgeItemDTO({
    required this.id,
    required this.quantity,
    required this.unit,
     this.expiryDate,
    required this.fridgeName,
    required this.food,
  });

  factory FridgeItemDTO.fromJson(Map<String, dynamic> json) {
    return FridgeItemDTO(
      id: json['id'],
      quantity: json['quantity'],
      unit: json['unit'],
      expiryDate: json['expiryDate'] != null
          ? DateTime.parse(json['expiryDate'])
          : null,
      fridgeName: json['fridgeName'] ?? '',
      food: FoodDTO.fromJson(json['Food'] ?? {}),
    );
  }
}
