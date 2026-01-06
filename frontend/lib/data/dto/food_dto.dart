class FoodDTO {
  final int id;
  final String name;
  final String type;
  final String? imageurl;

  FoodDTO({
    required this.id,
    required this.name,
    required this.type,
    this.imageurl,
  });

  factory FoodDTO.fromJson(Map<String, dynamic> json) {
    return FoodDTO(
      id: json['id'],
      name: json['name'],
      type: json['type'],
      imageurl: json['imageurl'],
    );
  }
}
