const API_URL = "http://localhost:5000"; // backend ka URL

// ---------- SIGNUP ----------
document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  try {
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();
    console.log("Signup Response:", data);
    alert(data.message || data.error);
  } catch (err) {
    console.error(err);
    alert("Signup failed");
  }
});

// ---------- LOGIN ----------
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    console.log("Login Response:", data);

    if (data.user) {
      localStorage.setItem("userId", data.user._id); // userId save
      alert("Login successful");
      fetchProducts();
    } else {
      alert(data.error);
    }
  } catch (err) {
    console.error(err);
    alert("Login failed");
  }
});

// ---------- FETCH PRODUCTS ----------
async function fetchProducts() {
  try {
    const res = await fetch(`${API_URL}/card/all`);
    const products = await res.json();

    const productsDiv = document.getElementById("products");
    productsDiv.innerHTML = "";

    products.forEach((product) => {
      const div = document.createElement("div");
      div.innerHTML = `
        <h4>${product.name}</h4>
        <p>${product.price}</p>
        <p>${product.description || ""}</p>
        <img src="${product.image || ""}" width="150" alt="${product.name}"><br>
        <button onclick="addToCart('${product._id}')">Add to Cart</button>
        <button onclick="toggleFavorite('${product._id}')">❤️ Favorite</button>
        <hr>
      `;
      productsDiv.appendChild(div);
    });
  } catch (err) {
    console.error(err);
  }
}

// ---------- ADD TO CART ----------
async function addToCart(productId) {
  const userId = localStorage.getItem("userId");
  if (!userId) return alert("Please login first");

  try {
    const res = await fetch(`${API_URL}/cart/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, productId })
    });

    const data = await res.json();
    console.log("Cart Response:", data);
    alert("Added to cart!");
  } catch (err) {
    console.error(err);
    alert("Failed to add to cart");
  }
}

// ---------- REMOVE FROM CART ----------
async function removeFromCart(productId) {
  const userId = localStorage.getItem("userId");
  if (!userId) return alert("Please login first");

  try {
    const res = await fetch(`${API_URL}/cart/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, productId })
    });

    const data = await res.json();
    console.log("Remove Cart Response:", data);
    alert("Removed from cart!");
  } catch (err) {
    console.error(err);
    alert("Failed to remove from cart");
  }
}

// ---------- TOGGLE FAVORITE ----------
async function toggleFavorite(productId) {
  const userId = localStorage.getItem("userId");
  if (!userId) return alert("Please login first");

  try {
    const res = await fetch(`${API_URL}/favorites/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, productId })
    });

    const data = await res.json();
    console.log("Favorite Response:", data);
    alert("Toggled favorite!");
  } catch (err) {
    console.error(err);
    alert("Failed to toggle favorite");
  }
}

// ---------- INIT ----------
fetchProducts(); // page load pe products show
