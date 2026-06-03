const Product = require("../models/Product");

async function getAllProducts(req, res) {
  try {
    const products = await Product.find()
      .populate("owner", "name email role")
      .sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/** All products listed by the logged-in admin (uses owner foreign key). */
async function getMyProducts(req, res) {
  try {
    const products = await Product.find({ owner: req.user.id })
      .populate("owner", "name email role")
      .sort({ createdAt: -1 });
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

module.exports = { getAllProducts, getMyProducts, deleteProduct };
