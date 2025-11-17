export function authMiddleware(req, res, next) {
  console.log("⚠️ Token authentication skipped.");
  next();
}
