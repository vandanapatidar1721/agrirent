const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  // Token can be in Authorization: Bearer <token> OR just token
  const authorization = req.headers["authorization"] || "";
  const token = authorization.split(" ")[1];

  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
}

// 🔹 JWT Generate function add kiya
function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },   // payload
    process.env.JWT_SECRET,              // secret
    { expiresIn: "1h" }                  // expiry
  );
}

module.exports = { auth, allowRoles, generateToken };
