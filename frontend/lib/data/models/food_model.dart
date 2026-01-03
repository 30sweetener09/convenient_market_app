class Food {
  final int id;
  final String name;
  final String type;
  final String image;
  final String unit;
  final String category;

  Food({
    required this.id,
    required this.name,
    required this.type,
    required this.image,
    required this.unit,
    required this.category
  });

  factory Food.fromJson(Map<String, dynamic> json) {
    return Food(
      id: json['id'],
      name: json['name'],
      type: json['type'],
      image:json['imageUrl'] ?? '',
      unit: json['UnitOfMeasurement']['unitName'],
      category: json['FoodCategory']['name']
    );
  }
}
