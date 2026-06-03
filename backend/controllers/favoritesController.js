const User = require("../models/User");
const { getSanitizedProfile } = require("../utils/userProfile");

async function toggleFavorite(req, res) {
  try {
    const { productId } = req.body;
    const id = req.user.id;

    if (!productId) {
      return res.status(400).json({ error: "productId is required" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.favorites.some((favId) => favId.equals(productId))) {
      user.favorites = user.favorites.filter((favId) => !favId.equals(productId));
    } else {
      user.favorites.push(productId);
    }

    await user.save();
    const profile = await getSanitizedProfile(id);
    res.status(200).json({ message: "Favorites updated", user: profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { toggleFavorite };
