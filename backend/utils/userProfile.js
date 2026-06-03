const User = require("../models/User");
const { sanitizeUser } = require("./jwt");

async function findUserProfile(userId) {
  return User.findById(userId)
    .populate("cart.product")
    .populate("favorites");
}

async function getSanitizedProfile(userId) {
  const user = await findUserProfile(userId);
  if (!user) return null;
  return sanitizeUser(user);
}

module.exports = { findUserProfile, getSanitizedProfile };
