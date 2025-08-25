const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ["renter", "owner"],
      required: true,
    },
  },
  { timestamps: true }
);

// Unique index on email (1 person per email)
userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model("User", userSchema);
