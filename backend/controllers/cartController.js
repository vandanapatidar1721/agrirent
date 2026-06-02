const User = require("../models/User");

function resolveUserId(req) {
  return (req.user && req.user.id) || req.body.userId;
}

async function addToCart(req, res) {
  try {
    const { productId } = req.body;
    const id = resolveUserId(req);

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const index = user.cart.findIndex((item) => item.product.equals(productId));
    if (index > -1) {
      user.cart[index].quantity += 1;
    } else {
      user.cart.push({ product: productId, quantity: 1 });
    }

    await user.save();
    res.status(200).json(user.cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function removeFromCart(req, res) {
  try {
    const { productId } = req.body;
    const id = resolveUserId(req);

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.cart = user.cart.filter((item) => !item.product.equals(productId));
    await user.save();
    res.status(200).json(user.cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { addToCart, removeFromCart };
