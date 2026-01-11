enum ExpiryStatus {
  safe,
  warning,
  expired,
}

ExpiryStatus getExpiryStatus(DateTime? expiryDate) {
  if (expiryDate == null) return ExpiryStatus.safe;

  final now = DateTime.now();
  final diff = expiryDate.difference(now).inDays;

  if (diff < 0) return ExpiryStatus.expired;
  if (diff <= 2) return ExpiryStatus.warning;
  return ExpiryStatus.safe;
}
