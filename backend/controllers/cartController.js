const User = require("../models/User");
const { getSanitizedProfile } = require("../utils/userProfile");

async function addToCart(req, res) {
  try {
    const { productId, driverSelected } = req.body;
    const id = req.user.id;

    if (!productId) {
      return res.status(400).json({ error: "productId is required" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const index = user.cart.findIndex((item) => item.product.equals(productId));
    if (index > -1) {
      user.cart[index].quantity += 1;
      user.cart[index].driverSelected = Boolean(driverSelected);
    } else {
      user.cart.push({
        product: productId,
        quantity: 1,
        driverSelected: Boolean(driverSelected),
      });
    }

    await user.save();
    const profile = await getSanitizedProfile(id);
    res.status(200).json({ message: "Added to cart", user: profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function removeFromCart(req, res) {
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

    user.cart = user.cart.filter((item) => !item.product.equals(productId));
    await user.save();

    const profile = await getSanitizedProfile(id);
    res.status(200).json({ message: "Removed from cart", user: profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function clearCart(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.cart = [];
    await user.save();

    const profile = await getSanitizedProfile(req.user.id);
    res.status(200).json({ message: "Cart cleared", user: profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { addToCart, removeFromCart, clearCart };
