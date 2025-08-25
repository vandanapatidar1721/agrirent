const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRouter = require("./routers/auth");
app.use("/auth", authRouter);
// Root
app.get("/", (req, res) => {
  res.send("AgriRent API is running ");
});

// DB connect + Server start
const { MONGO_URI, PORT } = process.env;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected ");
    app.listen(PORT || 5000, () => {
      console.log(`Server running on port ${PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error("DB Connection Failed ", err);
  });
