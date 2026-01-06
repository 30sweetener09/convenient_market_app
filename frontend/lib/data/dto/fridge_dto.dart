class FridgeDTO {
  final int id;
  final String name;
  final String? description;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int groupId;

  FridgeDTO({
    required this.id,
    required this.name,
    this.description,
    required this.createdAt,
    required this.updatedAt,
    required this.groupId,
  });

  factory FridgeDTO.fromJson(Map<String, dynamic> json) {
    return FridgeDTO(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      createdAt: DateTime.parse(json['createdat']),
      updatedAt: DateTime.parse(json['updatedat']),
      groupId: json['group_id'],
    );
  }
}
