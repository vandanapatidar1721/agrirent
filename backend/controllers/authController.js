const User = require("../models/User");
const { signToken, sanitizeUser } = require("../utils/jwt");
const { findUserProfile } = require("../utils/userProfile");

const VALID_ROLES = ["renter", "farmer", "admin"];

async function signup(req, res) {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = email.toLowerCase().trim(); // 👈 add this
    const normalizedRole =
      role && VALID_ROLES.includes(role) ? role : "renter";

    const existingUser = await User.findOne({ email: normalizedEmail }); // 👈 use normalizedEmail
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const user = new User({ name, email: normalizedEmail, password, role: normalizedRole }); // 👈 use normalizedEmail
    await user.save();

    res.status(201).json({
      message: "User registered. Please log in.",
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    console.log("=== LOGIN DEBUG ===");
    console.log("Raw email:", JSON.stringify(email));
    console.log("Raw password:", JSON.stringify(password));

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log("Normalized email:", normalizedEmail);

    const user = await User.findOne({ email: normalizedEmail });
    console.log("User found:", user ? `YES — id: ${user._id}, email: ${user.email}` : "NO");

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    console.log("Password match:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const profile = await findUserProfile(user._id);
    const token = signToken(user);

    res.status(200).json({
      message: "Login successful",
      user: sanitizeUser(profile),
      token,
    });
  } catch (err) {
    console.error("[login] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getMe(req, res) {
  try {
    const profile = await findUserProfile(req.user.id);
    if (!profile) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ user: sanitizeUser(profile) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { signup, login, getMe };
