const express = require("express");
const favoritesController = require("../controllers/favoritesController");
const { auth, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.post(
  "/toggle",
  auth,
  allowRoles("renter"),
  favoritesController.toggleFavorite
);

module.exports = router;
