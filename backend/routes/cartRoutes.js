const express = require("express");
const cartController = require("../controllers/cartController");
const { auth, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.post("/add", auth, allowRoles("renter"), cartController.addToCart);
router.post(
  "/remove",
  auth,
  allowRoles("renter"),
  cartController.removeFromCart
);
router.post("/clear", auth, allowRoles("renter"), cartController.clearCart);

module.exports = router;
