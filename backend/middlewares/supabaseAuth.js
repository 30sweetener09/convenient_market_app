import jwt from "jsonwebtoken";


export const supabaseAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];

    const decoded = jwt.decode(token);

    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const userId =
      decoded.sub ||
      decoded.user_id ||
      decoded.id ||
      decoded["https://supabase.io/user_id"];

    if (!userId) {
      return res.status(401).json({ error: "Token missing user id" });
    }

    req.user = { id: userId };
    next();
  } catch (err) {
    console.error("Supabase auth error:", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
};