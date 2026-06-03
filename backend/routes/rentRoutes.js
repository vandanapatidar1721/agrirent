const express = require("express");
const rentController = require("../controllers/rentController");
const { auth, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.post(
  "/submit",
  auth,
  allowRoles("admin"),
  rentController.submitRent
);

module.exports = router;
