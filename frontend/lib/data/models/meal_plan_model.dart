class MealPlan {
  final int id;
  final String name;
  final String description;
  final DateTime timestamp;
  final String status;
  final int groupId;

  MealPlan({
    required this.id,
    required this.name,
    required this.description,
    required this.timestamp,
    required this.status,
    required this.groupId
  });

  factory MealPlan.fromJson(Map<String, dynamic> json) {
    return MealPlan(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      timestamp: json['timestamp'],
      status: json['status'],
      groupId: json['groupId'],
    );
  }
}
