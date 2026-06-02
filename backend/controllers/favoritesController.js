const User = require("../models/User");

function resolveUserId(req) {
  return (req.user && req.user.id) || req.body.userId;
}

async function toggleFavorite(req, res) {
  try {
    const { productId } = req.body;
    const id = resolveUserId(req);

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
    res.status(200).json(user.favorites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { toggleFavorite };
