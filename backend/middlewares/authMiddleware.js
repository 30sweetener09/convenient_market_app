export function authMiddleware(req, res, next) {
  console.log("⚠️ Token authentication skipped (mocked user).");

  req.user = { id: 1 };

  next();
}
