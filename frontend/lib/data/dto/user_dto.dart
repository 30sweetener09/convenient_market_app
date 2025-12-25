class UserDTO {
  final String username;
  final String email;
  final String password;
  final String birthdate;
  final String gender;

  UserDTO({
    required this.username,
    required this.email,
    required this.password,
    required this.birthdate,
    required this.gender,
  });
}