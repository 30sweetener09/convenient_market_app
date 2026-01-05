class MealTask {
  final int id;
  final String name;
  final String description;
  bool isdone;
  String? assigntouser_id;
  final int mealplan_id;
  final String? assignTo;

  MealTask({
    required this.id,
    required this.name,
    required this.description,
    this.isdone = false,
    this.assigntouser_id,
    required this.mealplan_id,
    this.assignTo,
  });

  factory MealTask.fromJson(Map<String, dynamic> json) {
    return MealTask(
        id: json['id'],
        name: json['name'],
        description: json['description'],
        isdone:json['isdone'] ?? false,
        assigntouser_id: json['assigntouser_id'],
        mealplan_id: json['mealplan_id']
    );
  }
}
