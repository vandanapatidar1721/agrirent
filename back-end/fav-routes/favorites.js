const express = require("express");
const router = express.Router();
const User = require("../models/User"); // apna User model ka sahi path

// Add to favorites
router.post("/add", async (req, res) => {
  const { userId, productId } = req.body;
  console.log(" Fav Add Request:", req.body);

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.favorites.includes(productId)) {
      user.favorites.push(productId);
      console.log(` Added to favorites: ${productId}`);
    } else {
      console.log(`⚠️ Already in favorites: ${productId}`);
    }

    await user.save();
    console.log(" Updated Favorites:", user.favorites);

    res.status(200).json(user.favorites);
  } catch (err) {
    console.error(" Error in add favorites:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
