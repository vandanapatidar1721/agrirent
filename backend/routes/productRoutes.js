const express = require("express");
const productController = require("../controllers/productController");
const { auth, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/all", productController.getAllProducts);
router.get(
  "/mine",
  auth,
  allowRoles("admin"),
  productController.getMyProducts
);
router.delete(
  "/:id",
  auth,
  allowRoles("admin"),
  productController.deleteProduct
);

module.exports = router;
