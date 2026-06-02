const User = require("../models/User");
const Product = require("../models/Product");
const Equipment = require("../models/Equipment");

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=500&h=300&fit=crop";

async function submitRent(req, res) {
  try {
    const {
      userId,
      name,
      price,
      description,
      imageUrl,
      location,
      hasDriver,
      driverPrice,
    } = req.body;

    const id = (req.user && req.user.id) || userId;
    const user = await User.findById(id);
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
      owner: id,
    });
    await newProduct.save();

    const rentForm = new Equipment({
      userId: id,
      name,
      price,
      description,
      imageUrl,
      location,
      hasDriver: normalizedHasDriver,
      driverPrice: normalizedDriverPrice,
    });
    await rentForm.save();

    res.status(201).json({
      message: "Equipment listed successfully!",
      product: newProduct,
      rentForm,
    });
  } catch (err) {
    console.error("Rent submission error:", err);
    res.status(500).json({ error: err.message });
  }
}

async function getAllRents(req, res) {
  try {
    const rents = await Equipment.find().populate("userId", "name email");
    res.status(200).json(rents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { submitRent, getAllRents };
