class Recipe {
  final int id;
  final String name;
  final String description;
  final String htmlContent;
  final String image;

  Recipe({
    required this.id,
    required this.name,
    required this.description,
    required this.htmlContent,
    required this.image,
  });

  factory Recipe.fromJson(Map<String, dynamic> json) {
    return Recipe(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      htmlContent: json['htmlContent'],
      image: json['imageurl'] ?? '',
    );
  }
}
