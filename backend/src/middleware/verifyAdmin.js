const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET || "mysecretkey123";

/**
 * Middleware: verifies JWT and enforces role === "admin".
 * Attach as route middleware on any admin-only endpoint.
 */
const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

module.exports = verifyAdmin;
