class GroupDTO {
  final String id;
  final String name;
  final String? description;
  final DateTime createdAt;
  final String? imageurl;
  final String? role;

  GroupDTO({
    required this.id,
    required this.name,
    this.description,
    required this.createdAt,
    this.imageurl,
    this.role,
  });

  factory GroupDTO.fromJson(Map<String, dynamic> json) {
    return GroupDTO(
      id: json['id'].toString(),
      name: json['name'],
      description: json['description'] ?? '',
      createdAt: DateTime.parse(json['created_at'] as String),
      imageurl: json['imageurl'] ?? '',
      role: json['role'] ?? '',
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'id': id.toString(),
      'name': name,
      'imageurl': imageurl,
      'created_at': createdAt.toIso8601String(),
      'description': description,
      'role': role,
    };
  }

  factory GroupDTO.fromSearchJson(Map<String, dynamic> searchItem) {
    final groupData = searchItem['group'] as Map<String, dynamic>;
    final role = searchItem['role_in_group'] as String;

    return GroupDTO(
      id: groupData['id'].toString(),
      name: groupData['name'] as String,
      description: groupData['description'] as String? ?? '',
      createdAt: DateTime.now(),
      imageurl: groupData['imageurl'] as String?,
      role: role,
    );
  }
}
