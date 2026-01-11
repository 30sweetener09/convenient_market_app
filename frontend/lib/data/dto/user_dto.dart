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
      photoUrl: json['photourl'] ?? json['imageurl'],
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
  // Thêm getter để format
  String get formattedGender {
    if (gender.isEmpty) return 'Chưa cập nhật';
    
    switch (gender.toLowerCase()) {
      case 'male':
        return 'Nam';
      case 'female':
        return 'Nữ';
      case 'other':
        return '(không có)';
      default:
        return gender; // Giữ nguyên nếu không phải các giá trị trên
    }
  }
}
