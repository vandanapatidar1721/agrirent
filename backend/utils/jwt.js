const jwt = require("jsonwebtoken");

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function sanitizeUser(user) {
  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
}

module.exports = { signToken, sanitizeUser };
