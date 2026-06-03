let currentUser = null;
let equipments = [];
let currentRenderedList = [];
let rented = [];
let favorites = [];

const equipmentList = document.getElementById("equipment-list");
const cartItems = document.getElementById("cart-items");
const favItems = document.getElementById("fav-items");
const cartCount = document.getElementById("cart-count");
const favCount = document.getElementById("fav-count");
const totalBtn = document.getElementById("total-btn");

const API_BASE_URL =
  (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) ||
  "http://localhost:5000";

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=500&h=300&fit=crop";

// ---------- API ----------
async function apiCall(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...AuthCookies.getAuthHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

// ---------- Auth ----------
async function signup(name, email, password, role = "renter") {
  try {
    const data = await apiCall("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password, role }),
    });
    return {
      success: true,
      message: data.message || "Account created. Please log in.",
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function login(email, password) {
  try {
    const data = await apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (data.token && data.user) {
      AuthCookies.setAuthSession(data.user, data.token);
      applyUserFromResponse(data.user);
    }
    return { success: true, message: "Login successful!" };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function refreshSession() {
  const data = await apiCall("/auth/me");
  applyUserFromResponse(data.user);
}

function applyUserFromResponse(user) {
  if (!user) return;
  currentUser = user;
  AuthCookies.setAuthUser(user);
  syncCartAndFavoritesFromUser(user);
}

function logout() {
  currentUser = null;
  rented = [];
  favorites = [];
  AuthCookies.clearAuthSession();

  updateCart();
  updateFav();
  updateAuthUI();
  updateNavForRole();

  const page = getCurrentPage();
  if (page !== "index.html" && page !== "") {
    window.location.href = "index.html";
    return;
  }

  loadEquipments();
}

// ---------- Map DB product → UI card ----------
function mapProductToItem(product, driverSelected = false) {
  const priceNum = product.price;
  let img = product.image || PLACEHOLDER_IMG;
  if (img.startsWith("data:") || img.startsWith("http")) {
    // base64 or remote URL — use as-is
  } else {
    // local file in frontend folder (e.g. tractor.jpg)
    img = img.replace(/^\//, "");
  }

  return {
    id: product._id,
    name: product.name,
    price: `₹${priceNum}/day`,
    priceNum,
    img,
    location: product.location || "India",
    userId: product.owner?._id || product.owner || null,
    ownerId: product.owner?._id || product.owner || null,
    ownerName: product.owner?.name || null,
    ownerEmail: product.owner?.email || null,
    hasDriver: Boolean(product.hasDriver),
    driverPrice: product.driverPrice || 0,
    driverSelected: Boolean(driverSelected),
  };
}

function syncCartAndFavoritesFromUser(user) {
  rented = (user.cart || [])
    .map((entry) => {
      const product = entry.product;
      if (!product || !product._id) return null;
      return mapProductToItem(product, entry.driverSelected);
    })
    .filter(Boolean);

  favorites = (user.favorites || [])
    .map((product) => {
      if (!product || !product._id) return null;
      return mapProductToItem(product);
    })
    .filter(Boolean);

  updateCart();
  updateFav();
  if (equipments.length) {
    renderEquipments(equipments);
  }
}

function isFavorite(productId) {
  return favorites.some((f) => String(f.id) === String(productId));
}

// ---------- Equipment ----------
async function loadEquipments() {
  if (!equipmentList) return;

  try {
    const endpoint = isAdminListingsPage() ? "/card/mine" : "/card/all";
    const apiProducts = await apiCall(endpoint);
    equipments = apiProducts.map((p) => mapProductToItem(p));
    renderEquipments(equipments);
  } catch (error) {
    console.error("Failed to load equipments:", error);
    equipments = [];
    equipmentList.innerHTML =
      '<p class="empty-msg">Could not load equipment. Is the backend running on port 5000?</p>';
  }
}

// ---------- Cart (MongoDB via API) ----------
async function addToCart(index, withDriver = false) {
  if (!currentUser) {
    alert("Please login to rent equipment");
    document.getElementById("loginForm")?.style.setProperty("display", "flex");
    return;
  }
  if (currentUser.role !== "renter") {
    alert("Only renters can add items to cart.");
    return;
  }

  const item = currentRenderedList[index];
  if (!item?.id) {
    alert("This listing is not available for online booking yet.");
    return;
  }

  try {
    const data = await apiCall("/cart/add", {
      method: "POST",
      body: JSON.stringify({
        productId: item.id,
        driverSelected: Boolean(item.hasDriver && withDriver),
      }),
    });
    applyUserFromResponse(data.user);
  } catch (error) {
    alert(error.message || "Failed to add to cart");
  }
}

async function removeFromCart(index) {
  const item = rented[index];
  if (!item?.id || !currentUser) return;

  try {
    const data = await apiCall("/cart/remove", {
      method: "POST",
      body: JSON.stringify({ productId: item.id }),
    });
    applyUserFromResponse(data.user);
  } catch (error) {
    alert(error.message || "Failed to remove from cart");
  }
}

// ---------- Favorites (MongoDB via API) ----------
async function addToFav(index) {
  if (!currentUser) {
    alert("Please login to save favorites");
    document.getElementById("loginForm")?.style.setProperty("display", "flex");
    return;
  }
  if (currentUser.role !== "renter") {
    alert("Only renters can use favorites.");
    return;
  }

  const item = currentRenderedList[index];
  if (!item?.id) return;

  try {
    const data = await apiCall("/favorites/toggle", {
      method: "POST",
      body: JSON.stringify({ productId: item.id }),
    });
    applyUserFromResponse(data.user);
  } catch (error) {
    alert(error.message || "Failed to update favorites");
  }
}

async function removeFromFav(index) {
  const item = favorites[index];
  if (!item?.id || !currentUser) return;

  try {
    const data = await apiCall("/favorites/toggle", {
      method: "POST",
      body: JSON.stringify({ productId: item.id }),
    });
    applyUserFromResponse(data.user);
  } catch (error) {
    alert(error.message || "Failed to update favorites");
  }
}

function getCurrentPage() {
  return window.location.pathname.split("/").pop();
}

function isAdminListingsPage() {
  return getCurrentPage() === "Rent.html" && currentUser?.role === "admin";
}

function buildProductCardHtml(item, index, options = {}) {
  const { isAdmin = false, showRentActions = true } = options;
  const canDelete =
    isAdmin &&
    item.id &&
    item.ownerId &&
    currentUser &&
    String(currentUser._id) === String(item.ownerId);

  let rentBtns = "";
  if (showRentActions && !isAdmin && item.id) {
    rentBtns = `<button type="button" class="btn-card" onclick="addToCart(${index}, false)">Rent Now</button>`;
    if (item.hasDriver) {
      rentBtns += `<button type="button" class="btn-card btn-outline" onclick="addToCart(${index}, true)">+ Driver (₹${item.driverPrice}/day)</button>`;
    }
  }

  const favActive = isFavorite(item.id);
  const favBtn =
    showRentActions && !isAdmin && item.id
      ? `<button type="button" class="btn-card fav-btn${favActive ? " active" : ""}" onclick="addToFav(${index})">${favActive ? "♥ Saved" : "♡ Save"}</button>`
      : "";

  const driverLine = item.hasDriver
    ? `<p class="card-meta"><i class="fas fa-user"></i> Driver ₹${item.driverPrice}/day</p>`
    : `<p class="card-meta muted">No driver</p>`;

  const listedByLine = item.ownerName
    ? `<p class="card-meta listed-by"><i class="fas fa-user-tie"></i> Listed by ${item.ownerName}</p>`
    : `<p class="card-meta muted">Demo listing (no owner)</p>`;

  const deleteBtn = canDelete
    ? `<button type="button" class="btn-card danger-btn" onclick="deleteProduct('${item.id}')"><i class="fas fa-trash"></i> Delete</button>`
    : "";

  return `
    <div class="card-img-wrap">
      <img src="${item.img}" alt="${item.name}" loading="lazy" decoding="async"
        onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}'">
    </div>
    <div class="card-body">
      <h3 class="card-title">${item.name}</h3>
      <p class="card-price">${item.price}</p>
      <p class="card-meta"><i class="fas fa-location-dot"></i> ${item.location}</p>
      ${driverLine}
      ${listedByLine}
      <div class="card-actions">${rentBtns}${favBtn}${deleteBtn}</div>
    </div>
  `;
}

// ---------- Render ----------
function renderEquipments(list) {
  if (!equipmentList) return;

  const page = getCurrentPage();
  const isAdmin = currentUser?.role === "admin";
  const onAdminPage = isAdmin && page === "Rent.html";

  currentRenderedList = list;
  equipmentList.classList.toggle("product-grid", true);

  if (!list.length) {
    if (onAdminPage) {
      equipmentList.innerHTML = `
        <div class="admin-empty-state">
          <i class="fas fa-box-open" aria-hidden="true"></i>
          <h3>No products yet</h3>
          <p>You have not listed any equipment. Add your first product to show it on the home page.</p>
          <button type="button" class="btn-primary" onclick="openAddProductModal()">
            <i class="fas fa-plus"></i> Add Product
          </button>
        </div>`;
      return;
    }

    equipmentList.innerHTML = `<p class="empty-msg">No equipment in the catalog yet.
      <br>Check back soon or contact an admin to add listings.</p>`;
    return;
  }

  equipmentList.innerHTML = "";
  list.forEach((item, index) => {
    const card = document.createElement("article");
    card.classList.add("card", "product-card");
    card.dataset.location = (item.location || "").toLowerCase();
    card.innerHTML = buildProductCardHtml(item, index, {
      isAdmin: onAdminPage,
      showRentActions: !onAdminPage,
    });
    equipmentList.appendChild(card);
  });
}

function setBadgeCount(el, mobileEl, count) {
  if (el) el.innerText = count;
  if (mobileEl) mobileEl.innerText = count;
}

function updateCart() {
  if (!cartItems) return;

  cartItems.innerHTML = "";
  let total = 0;

  rented.forEach((item, index) => {
    const equipmentPrice = item.priceNum || parseInt(item.price.replace(/[^\d]/g, ""), 10) || 0;
    const driverExtra = item.driverSelected ? item.driverPrice || 0 : 0;
    total += equipmentPrice + driverExtra;

    const li = document.createElement("li");
    const driverText =
      driverExtra > 0 ? ` + Driver ₹${driverExtra}/day` : "";
    li.innerHTML = `
      <span class="sidebar-thumb"><img src="${item.img}" class="sidebar-img" alt=""></span>
      <span>${item.name} — ${item.price}${driverText}</span>
      <button type="button" title="Remove" onclick="removeFromCart(${index})">&times;</button>
    `;
    cartItems.appendChild(li);
  });

  setBadgeCount(cartCount, document.getElementById("mobile-cart-count"), rented.length);
  if (totalBtn) totalBtn.innerText = "Total: ₹" + total;
}

function updateFav() {
  if (!favItems) return;

  favItems.innerHTML = "";
  favorites.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="sidebar-thumb"><img src="${item.img}" class="sidebar-img" alt=""></span>
      <span>${item.name} — ${item.price}</span>
      <button type="button" title="Remove" onclick="removeFromFav(${index})">&times;</button>
    `;
    favItems.appendChild(li);
  });

  setBadgeCount(favCount, document.getElementById("mobile-fav-count"), favorites.length);
}

function updateNavForRole() {
  const isAdmin = currentUser?.role === "admin";
  const isRenter = currentUser?.role === "renter";

  document.querySelectorAll(".nav-rent-link").forEach((el) => {
    el.style.display = !currentUser || isAdmin ? "" : "none";
  });

  document.querySelectorAll(".renter-only").forEach((el) => {
    el.style.display = isRenter ? "" : "none";
  });
}

function updateAuthUI() {
  const authButtonContainers = document.querySelectorAll(".auth-buttons");
  if (!authButtonContainers.length) return;

  const loginModal = document.getElementById("loginForm");
  const signupModal = document.getElementById("signupForm");

  authButtonContainers.forEach((container) => {
    const isMobile = !!container.closest(".mobile-icons");

    if (currentUser) {
      const roleLabel =
        currentUser.role === "admin"
          ? "Admin"
          : currentUser.role === "farmer"
            ? "Farmer"
            : "Renter";
      container.innerHTML = `
        <span class="user-greeting">Hi, ${currentUser.name} <small>(${roleLabel})</small></span>
        <button type="button" onclick="logout()">Logout</button>
      `;
      return;
    }

    if (!loginModal || !signupModal) {
      container.innerHTML = `<a href="index.html#login">Login</a>`;
      return;
    }

    const loginId = isMobile ? "mobile-loginBtn" : "loginBtn";
    const signupId = isMobile ? "mobile-signupBtn" : "signupBtn";

    container.innerHTML = `
      <button type="button" id="${loginId}">Login</button>
      <button type="button" id="${signupId}">Sign Up</button>
    `;

    container.querySelector(`#${loginId}`)?.addEventListener("click", () => {
      loginModal.style.display = "flex";
    });
    container.querySelector(`#${signupId}`)?.addEventListener("click", () => {
      signupModal.style.display = "flex";
    });
  });

  updateNavForRole();
}

function toggleCart() {
  const cartSidebar = document.getElementById("cart-sidebar");
  const favSidebar = document.getElementById("fav-sidebar");
  if (!cartSidebar) return;
  const willOpen = !cartSidebar.classList.contains("active");
  cartSidebar.classList.toggle("active");
  if (willOpen && favSidebar) favSidebar.classList.remove("active");
}

function toggleFav() {
  const favSidebar = document.getElementById("fav-sidebar");
  const cartSidebar = document.getElementById("cart-sidebar");
  if (!favSidebar) return;
  const willOpen = !favSidebar.classList.contains("active");
  favSidebar.classList.toggle("active");
  if (willOpen && cartSidebar) cartSidebar.classList.remove("active");
}

function toggleMenu() {
  const mobileNav = document.getElementById("mobileNav");
  const hamburger = document.querySelector(".hamburger");
  mobileNav?.classList.toggle("show");
  hamburger?.classList.toggle("active");
  document.body.classList.toggle("menu-open");
}

async function payNow() {
  if (!rented.length) {
    alert("Your cart is empty.");
    return;
  }
  if (!currentUser) {
    alert("Please login first.");
    return;
  }

  try {
    const data = await apiCall("/cart/clear", { method: "POST" });
    applyUserFromResponse(data.user);
    toggleCart();
    alert("Booking confirmed! Thank you for using AgriRent.");
  } catch (error) {
    alert(error.message || "Payment failed");
  }
}

function searchItem() {
  const input = document.querySelector(".search-bar input")?.value.toLowerCase().trim();
  if (!input) {
    renderEquipments(equipments);
    return;
  }
  const filtered = equipments.filter(
    (item) =>
      item.name.toLowerCase().includes(input) ||
      (item.location || "").toLowerCase().includes(input)
  );
  renderEquipments(filtered);
}

function toggleTheme() {
  const body = document.body;
  const themeIcon = document.getElementById("theme-icon");
  if (body.classList.contains("dark-mode")) {
    body.classList.remove("dark-mode");
    body.classList.add("light-mode");
    themeIcon?.classList.replace("fa-moon", "fa-sun");
  } else {
    body.classList.remove("light-mode");
    body.classList.add("dark-mode");
    themeIcon?.classList.replace("fa-sun", "fa-moon");
  }
}

async function initApp() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  const token = AuthCookies.getAuthToken();
  if (token) {
    try {
      await refreshSession();
    } catch {
      AuthCookies.clearAuthSession();
      currentUser = null;
    }
  }

  const page = window.location.pathname.split("/").pop();

  if (page === "Rent.html") {
    if (!currentUser || currentUser.role !== "admin") {
      alert("Only admins can list equipment here. Please log in as admin.");
      window.location.href = "index.html";
      return;
    }
  }

  await loadEquipments();
  updateAuthUI();
}

function setupAuthModals() {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  if (!loginForm || !signupForm) return;

  document.getElementById("loginBtn")?.addEventListener("click", () => {
    loginForm.style.display = "flex";
  });
  document.getElementById("signupBtn")?.addEventListener("click", () => {
    signupForm.style.display = "flex";
  });
  document.getElementById("closeLogin")?.addEventListener("click", () => {
    loginForm.style.display = "none";
  });
  document.getElementById("closeSignup")?.addEventListener("click", () => {
    signupForm.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === loginForm) loginForm.style.display = "none";
    if (e.target === signupForm) signupForm.style.display = "none";
  });

  if (window.location.hash === "#login") {
    loginForm.style.display = "flex";
  }

  loginForm.querySelector("button")?.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = loginForm.querySelector('input[type="email"]')?.value.trim();
    const password = loginForm.querySelector('input[type="password"]')?.value.trim();

    if (!email || !password) {
      alert("Please fill all fields");
      return;
    }

    const result = await login(email, password);
    alert(result.message);

    if (result.success) {
      loginForm.style.display = "none";
      updateAuthUI();
      if (currentUser?.role === "admin") {
        window.location.href = "Rent.html";
      } else {
        await loadEquipments();
      }
    }
  });

  signupForm.querySelector("button")?.addEventListener("click", async (e) => {
    e.preventDefault();
    const name = signupForm.querySelector('input[name="name"]')?.value.trim();
    const email = signupForm.querySelector('input[type="email"]')?.value.trim();
    const role = signupForm.querySelector("#signupRole")?.value || "renter";
    const password = signupForm.querySelector('input[type="password"]')?.value.trim();

    if (!name || !email || !password) {
      alert("Please fill all fields");
      return;
    }
    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    const result = await signup(name, email, password, role);
    alert(result.message);

    if (result.success) {
      signupForm.style.display = "none";
      signupForm.reset();
      loginForm.style.display = "flex";
    }
  });
}

function openAddProductModal() {
  const modal = document.getElementById("addProductModal");
  if (!modal) return;
  modal.style.display = "flex";
  modal.setAttribute("aria-hidden", "false");
  document.getElementById("formMessage").textContent = "";
}

function closeAddProductModal() {
  const modal = document.getElementById("addProductModal");
  if (!modal) return;
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
}

function resetProductForm() {
  const rentForm = document.getElementById("rentForm");
  const previewBox = document.getElementById("imagePreviewBox");
  const previewImg = document.getElementById("imagePreview");
  const driverPriceInput = document.getElementById("driverPrice");
  rentForm?.reset();
  if (driverPriceInput) driverPriceInput.disabled = true;
  if (previewBox) previewBox.hidden = true;
  if (previewImg) previewImg.removeAttribute("src");
}

function setupRentForm() {
  const rentForm = document.getElementById("rentForm");
  const formMessage = document.getElementById("formMessage");
  if (!rentForm) return;

  document.getElementById("openAddProductBtn")?.addEventListener("click", openAddProductModal);
  document.getElementById("closeAddProduct")?.addEventListener("click", () => {
    closeAddProductModal();
    resetProductForm();
  });
  document.getElementById("cancelAddProduct")?.addEventListener("click", () => {
    closeAddProductModal();
    resetProductForm();
  });

  const modal = document.getElementById("addProductModal");
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeAddProductModal();
      resetProductForm();
    }
  });

  const driverToggle = document.getElementById("equipmentHasDriver");
  const driverPriceInput = document.getElementById("driverPrice");
  const imageInput = document.getElementById("equipmentImage");
  const previewBox = document.getElementById("imagePreviewBox");
  const previewImg = document.getElementById("imagePreview");

  if (driverToggle && driverPriceInput) {
    driverToggle.addEventListener("change", () => {
      driverPriceInput.disabled = !driverToggle.checked;
    });
  }

  imageInput?.addEventListener("change", async () => {
    const file = imageInput.files?.[0];
    if (!file || !previewImg || !previewBox) return;
    try {
      const previewUrl = await resizeImageToSquare(file, 400, 0.85);
      previewImg.src = previewUrl;
      previewBox.hidden = false;
    } catch {
      previewBox.hidden = true;
    }
  });

  rentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentUser || currentUser.role !== "admin") {
      alert("Only admin can list equipment.");
      return;
    }

    const name = document.getElementById("equipmentName").value.trim();
    const price = document.getElementById("equipmentPrice").value;
    const location = document.getElementById("equipmentLocation").value.trim();
    const hasDriver = document.getElementById("equipmentHasDriver")?.checked;
    const driverPriceRaw = document.getElementById("driverPrice")?.value;
    const image = document.getElementById("equipmentImage").files[0];
    const submitBtn = rentForm.querySelector('button[type="submit"]');

    if (!name || !price || !location || !image) {
      formMessage.style.color = "#c62828";
      formMessage.textContent = "Please fill all fields and choose an image.";
      return;
    }

    let driverPrice = 0;
    if (hasDriver) {
      const parsed = parseInt(driverPriceRaw, 10);
      if (Number.isNaN(parsed) || parsed < 0) {
        formMessage.style.color = "#c62828";
        formMessage.textContent = "Enter a valid driver price.";
        return;
      }
      driverPrice = parsed;
    }

    submitBtn.disabled = true;
    formMessage.textContent = "Uploading…";

    try {
      const imageUrl = await resizeImageToSquare(image, 800, 0.85);

      const data = await apiCall("/rent/submit", {
        method: "POST",
        body: JSON.stringify({
          name,
          price: parseInt(price, 10),
          description: `${name} available for rent${hasDriver ? " with driver" : ""}`,
          imageUrl,
          location,
          hasDriver,
          driverPrice,
        }),
      });

      formMessage.style.color = "#2e7d32";
      formMessage.textContent = `${data.product.name} listed successfully!`;
      resetProductForm();
      closeAddProductModal();
      await loadEquipments();
    } catch (error) {
      formMessage.style.color = "#c62828";
      formMessage.textContent = error.message || "Something went wrong.";
    } finally {
      submitBtn.disabled = false;
    }
  });
}

function setupMobileMenuClose() {
  document.addEventListener("click", (event) => {
    const mobileNav = document.getElementById("mobileNav");
    const hamburger = document.querySelector(".hamburger");
    if (mobileNav?.classList.contains("show")) {
      if (!mobileNav.contains(event.target) && !hamburger?.contains(event.target)) {
        mobileNav.classList.remove("show");
        document.body.classList.remove("menu-open");
        hamburger?.classList.remove("active");
      }
    }
  });

  document.querySelectorAll(".mobile-nav a").forEach((link) => {
    link.addEventListener("click", () => {
      document.getElementById("mobileNav")?.classList.remove("show");
      document.querySelector(".hamburger")?.classList.remove("active");
      document.body.classList.remove("menu-open");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("light-mode");
  initApp();
  setupAuthModals();
  setupRentForm();
  setupMobileMenuClose();
});

window.addToCart = addToCart;
window.addToFav = addToFav;
window.removeFromCart = removeFromCart;
window.removeFromFav = removeFromFav;
window.toggleCart = toggleCart;
window.toggleFav = toggleFav;
window.toggleMenu = toggleMenu;
window.payNow = payNow;
window.searchItem = searchItem;
window.toggleTheme = toggleTheme;
window.logout = logout;

window.openAddProductModal = openAddProductModal;
window.closeAddProductModal = closeAddProductModal;

window.deleteProduct = async function (id) {
  if (!currentUser || currentUser.role !== "admin") {
    alert("Only admin can delete listings");
    return;
  }
  if (!confirm("Delete this listing?")) return;
  try {
    await apiCall(`/card/${id}`, { method: "DELETE" });
    await loadEquipments();
    alert("Deleted");
  } catch (e) {
    alert(e.message || "Failed to delete");
  }
};
