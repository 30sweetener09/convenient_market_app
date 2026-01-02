class UserDTO {
  final String username;
  final String? name;
  final String email;
  final String password;
  final String birthdate;
  final String gender;
  final String? photoUrl; 

  UserDTO({
    required this.username,
    required this.email,
    required this.password,
    required this.birthdate,
    required this.gender,
    this.photoUrl,
    this.name,
  });

  factory UserDTO.fromJson(Map<String, dynamic> json) {
    return UserDTO(
      email: json['email'] ?? '',
      username: json['username'] ?? '',
      birthdate: json['birthdate'] ?? '',
      gender: json['gender'] ?? '',
      photoUrl: json['photoUrl'],
      name: json['name'],
      password: '', // Không bao giờ lấy mật khẩu từ API
    );
  }
  Map<String, dynamic> toApiMap() {
    return {
      'username': username,
      'image': photoUrl, // Map photoUrl thành 'image' cho API
    };
  }
}
