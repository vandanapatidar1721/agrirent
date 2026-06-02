const User = require("../models/User");
const { signToken, sanitizeUser } = require("../utils/jwt");

const VALID_ROLES = ["renter", "farmer", "admin"];

async function signup(req, res) {
  try {
    const { name, email, password, role } = req.body;
    const normalizedRole =
      role && VALID_ROLES.includes(role) ? role : "renter";

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const user = new User({ name, email, password, role: normalizedRole });
    await user.save();

    const token = signToken(user);
    res.status(201).json({
      message: "User registered",
      user: sanitizeUser(user),
      token,
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    if (role && role !== user.role) {
      return res.status(403).json({ error: "Role mismatch for this account" });
    }

    const token = signToken(user);
    res.status(200).json({
      message: "Login successful",
      user: sanitizeUser(user),
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { signup, login };
