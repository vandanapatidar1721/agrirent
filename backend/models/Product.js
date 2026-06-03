const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  image: { type: String },
  location: { type: String },
  hasDriver: { type: Boolean, default: false },
  driverPrice: { type: Number, default: 0 },
  /** Foreign key → User (admin who listed this product). Same idea as userId in SQL. */
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
