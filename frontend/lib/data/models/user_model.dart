class UserModel {
  final String id;
  final String email;
  final String name;
  final String accessToken;
  final String ? photoUrl;

  UserModel({
    required this.id,
    required this.email,
    required this.name,
    required this.accessToken,
    this.photoUrl,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'].toString(),
      email: json['email'] ?? '',
      name: json['name'] ?? '',
      accessToken: json['access_token'] ?? '',
      photoUrl: json['photoUrl'],
    );
  }
}
