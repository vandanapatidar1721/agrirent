const mongoose = require("mongoose");

const equipmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  location: { type: String, required: true },
  imageUrl: { type: String, required: true },
  hasDriver: { type: Boolean, default: false },
  driverPrice: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Equipment", equipmentSchema);
