const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { auth } = require("./middleware/auth");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ---------- API Logging Middleware ----------
app.use((req, res, next) => {
  const start = Date.now();
  const { method, url, body, query, params } = req;
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    const duration = Date.now() - start;
    try {
      console.log("\n=== API CALL ===");
      console.log("Method:", method);
      console.log("URL:", url);
      if (Object.keys(params || {}).length) console.log("Params:", params);
      if (Object.keys(query || {}).length) console.log("Query:", query);
      if (Object.keys(body || {}).length) console.log("Body:", body);
      console.log("Status:", res.statusCode);
      console.log("Response:", data);
      console.log("Duration:", `${duration}ms`);
      console.log("================\n");
    } catch (_) {}
    return originalJson(data);
  };
  next();
});

// Models
const User = require("./models/User");
const Product = require("./addcard-models/product");
const RentForm = require("./form-models/Equipment");

// ------------------ AUTH ROUTES ------------------
app.post("/auth/signup", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    // Create user with plain password - the User model will encrypt it automatically
    const user = new User({ name, email, password });
    await user.save();

    // Remove password from response for security
    const userObj = user.toObject();
    delete userObj.password;

    // Issue JWT token
    const token = require("jsonwebtoken").sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ message: "User registered", user: userObj, token });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    // Remove password from user object before sending to client
    const userObj = user.toObject();
    delete userObj.password;

    // Issue JWT token
    const token = require("jsonwebtoken").sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({ message: "Login successful", user: userObj, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------ PRODUCT ROUTES ------------------
app.post("/card/add", auth, async (req, res) => {
  const { name, price, description, image, userId } = req.body;
  try {
    if (!name || !price) return res.status(400).json({ error: "Name and Price are required" });
    const ownerId = (req.user && req.user.id) || userId || null;
    const newProduct = new Product({ name, price, description, image, owner: ownerId });
    await newProduct.save();

    res.status(201).json({ message: "Product added successfully", product: newProduct });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/card/all", async (req, res) => {
  try {
    const products = await Product.find().populate('owner', 'name email');
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a product by id
app.delete("/card/:id", auth, async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    const requesterId = req.user && req.user.id;
    if (product.owner && requesterId && String(product.owner) !== String(requesterId)) {
      return res.status(403).json({ error: "Not allowed to delete this product" });
    }
    await product.deleteOne();
    res.status(200).json({ message: "Product deleted", product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------ CART ROUTES ------------------
app.post("/cart/add", auth, async (req, res) => {
  const { userId, productId } = req.body;
  try {
    const id = (req.user && req.user.id) || userId;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const index = user.cart.findIndex((item) => item.product.equals(productId));
    if (index > -1) {
      user.cart[index].quantity += 1;
    } else {
      user.cart.push({ product: productId, quantity: 1 });
    }

    await user.save();
    res.status(200).json(user.cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/cart/remove", auth, async (req, res) => {
  const { userId, productId } = req.body;
  try {
    const id = (req.user && req.user.id) || userId;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.cart = user.cart.filter((item) => !item.product.equals(productId));
    await user.save();
    res.status(200).json(user.cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------ FAVORITES ROUTES ------------------
app.post("/favorites/toggle", auth, async (req, res) => {
  const { userId, productId } = req.body;
  try {
    const id = (req.user && req.user.id) || userId;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.favorites.some((id) => id.equals(productId))) {
      user.favorites = user.favorites.filter((id) => !id.equals(productId));
    } else {
      user.favorites.push(productId);
    }

    await user.save();
    res.status(200).json(user.favorites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/rent/submit", auth, async (req, res) => {
  const { userId, name, price, description, imageUrl, location } = req.body;

  try {
    const id = (req.user && req.user.id) || userId;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Create a new product that will show up in the equipment list
    const newProduct = new Product({
      name,
      price: parseInt(price),
      description: description || `${name} available for rent`,
      image: imageUrl || 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=500&h=300&fit=crop',
      owner: id
    });

    await newProduct.save();

    // Also save to rent collection for tracking
    const rentForm = new RentForm({
      userId: id,
      name,
      price,
      description,
      imageUrl,
      location
    });

    await rentForm.save();

    res.status(201).json({ 
      message: "Equipment listed successfully!", 
      product: newProduct,
      rentForm 
    });
  } catch (err) {
    console.error('Rent submission error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/product/all", async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/rent/all", async (req, res) => {
  try {
    const rents = await RentForm.find().populate("userId", "name email");
    res.status(200).json(rents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------ ROOT ------------------
app.get("/", (req, res) => {
  res.send("AgriRent API is running");
});

// ------------------ DB CONNECT + SERVER ------------------
const { MONGO_URI, PORT } = process.env;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT || 5000, () => {
      console.log(`Server running on port ${PORT || 5000}`);
    });
  })
  .catch((err) => console.error("DB Connection Failed", err));
