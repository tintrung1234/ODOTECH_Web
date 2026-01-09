const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return res.status(500).json({ error: "JWT_SECRET is not configured" });
  }

  // Try to get token from cookie first (preferred method)
  let token = req.cookies?.token || "";

  // Fallback to Authorization header for backward compatibility
  if (!token) {
    const authHeader = req.header("Authorization") || req.header("authorization") || "";
    token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";
  }

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded; // { uid, role }
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = authMiddleware;
