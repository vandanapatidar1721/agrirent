const Product = require("../models/Product");

async function addProduct(req, res) {
  try {
    const { name, price, description, image, userId } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: "Name and Price are required" });
    }

    const ownerId = (req.user && req.user.id) || userId || null;
    const newProduct = new Product({
      name,
      price,
      description,
      image,
      owner: ownerId,
    });
    await newProduct.save();

    res
      .status(201)
      .json({ message: "Product added successfully", product: newProduct });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getAllProducts(req, res) {
  try {
    const products = await Product.find().populate("owner", "name email");
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getAllProductsSimple(req, res) {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const requesterId = req.user && req.user.id;
    const requesterRole = req.user && req.user.role;

    if (requesterRole !== "admin") {
      return res.status(403).json({ error: "Only admin can delete products" });
    }

    if (
      product.owner &&
      requesterId &&
      String(product.owner) !== String(requesterId)
    ) {
      return res
        .status(403)
        .json({ error: "Not allowed to delete this product" });
    }

    await product.deleteOne();
    res.status(200).json({ message: "Product deleted", product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  addProduct,
  getAllProducts,
  getAllProductsSimple,
  deleteProduct,
};
