const express = require("express");
const productController = require("../controllers/productController");
const { auth, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.post("/add", auth, allowRoles("admin"), productController.addProduct);
router.get("/all", productController.getAllProducts);
router.delete(
  "/:id",
  auth,
  allowRoles("admin"),
  productController.deleteProduct
);

module.exports = router;
