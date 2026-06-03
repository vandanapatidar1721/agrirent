const express = require("express");

const authRoutes = require("./authRoutes");
const productRoutes = require("./productRoutes");
const cartRoutes = require("./cartRoutes");
const favoritesRoutes = require("./favoritesRoutes");
const rentRoutes = require("./rentRoutes");

const router = express.Router();

router.get("/", (req, res) => {
  res.send("AgriRent API is running");
});

router.use("/auth", authRoutes);
router.use("/card", productRoutes);
router.use("/cart", cartRoutes);
router.use("/favorites", favoritesRoutes);
router.use("/rent", rentRoutes);

module.exports = router;
