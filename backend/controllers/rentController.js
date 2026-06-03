const User = require("../models/User");
const Product = require("../models/Product");

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=500&h=300&fit=crop";

async function submitRent(req, res) {
  try {
    const {
      name,
      price,
      description,
      imageUrl,
      location,
      hasDriver,
      driverPrice,
    } = req.body;

    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const normalizedHasDriver = Boolean(hasDriver);
    const normalizedDriverPrice = normalizedHasDriver
      ? parseInt(driverPrice, 10) || 0
      : 0;

    const newProduct = new Product({
      name,
      price: parseInt(price, 10),
      description: description || `${name} available for rent`,
      image: imageUrl || DEFAULT_IMAGE,
      location,
      hasDriver: normalizedHasDriver,
      driverPrice: normalizedDriverPrice,
      owner: userId,
    });
    await newProduct.save();

    const populated = await Product.findById(newProduct._id).populate(
      "owner",
      "name email role"
    );

    res.status(201).json({
      message: "Equipment listed successfully!",
      product: populated,
    });
  } catch (err) {
    console.error("Rent submission error:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { submitRent };
