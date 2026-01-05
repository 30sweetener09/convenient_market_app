class MemberDTO {
  final String id;
  final String username;
  final String email;
  final DateTime? joinedAt;
  final String? imageurl;
  final String roleInGroup;

  MemberDTO({
    required this.id,
    required this.username,
    required this.email,
    this.joinedAt,
    this.imageurl,
    required this.roleInGroup,
  });
}
