class GroupExpiryStats {
  final int safe;
  final int warning;
  final int expired;

  GroupExpiryStats({
    required this.safe,
    required this.warning,
    required this.expired,
  });

  int get total => safe + warning + expired;
}
