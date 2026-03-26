// Global variables
let currentUser = null;
let equipments = [];
let currentRenderedList = [];
let rented = [];
let favorites = [];

// DOM elements
const equipmentList = document.getElementById("equipment-list");
const cartItems = document.getElementById("cart-items");
const favItems = document.getElementById("fav-items");
const cartCount = document.getElementById("cart-count");
const favCount = document.getElementById("fav-count");
const totalBtn = document.getElementById("total-btn");

// API Base URL
const API_BASE_URL = "http://localhost:5000";

// ---------- API Functions ----------
async function apiCall(endpoint, options = {}) {
  try {
    const token = localStorage.getItem('token');
    const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,
        ...(options.headers || {})
      },
      ...options
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'API call failed');
    }
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ---------- Authentication Functions ----------
async function signup(name, email, password, role = "renter") {
  try {
    const data = await apiCall('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role })
    });
    currentUser = data.user;
    localStorage.setItem('user', JSON.stringify(currentUser));
    if (data.token) localStorage.setItem('token', data.token);
    return { success: true, message: 'Signup successful!' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function login(email, password, role) {
  try {
    const data = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role })
    });
    currentUser = data.user;
    localStorage.setItem('user', JSON.stringify(currentUser));
    if (data.token) localStorage.setItem('token', data.token);
    return { success: true, message: 'Login successful!' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

function logout() {
  const wasAdmin = currentUser?.role === 'admin';
  currentUser = null;
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  rented = [];
  favorites = [];
  updateCart();
  updateFav();
  updateAuthUI();

  if (wasAdmin && window.location.pathname.split('/').pop() === 'Rent.html') {
    window.location.href = 'index.html';
  }
}

// ---------- Equipment Functions ----------
async function loadEquipments() {
  try {
    console.log('Loading equipments from API...');
    // Load from both hardcoded data and API
    const apiProducts = await apiCall('/card/all');
    console.log('API Products received:', apiProducts);

    // Convert API products to match frontend format
    const apiEquipments = apiProducts.map(product => ({
      name: product.name,
      price: `₹${product.price}/day`,
      img: product.image || 'tractor.jpg', // default image
      location: product.location || 'Available Location', // fallback location
      id: product._id,
      ownerId: product.owner?._id || product.owner || null,
      hasDriver: Boolean(product.hasDriver),
      driverPrice: product.driverPrice || 0
    }));
    
    // Hardcoded equipment data
    const hardcodedEquipments = [
      {name: "Tractor", price: "₹500/day", img: "tractor.jpg", location: "Delhi"},
      {name: "Drone", price: "₹1000/day", img: "Drone.jpg", location: "Mumbai"},
      {name: "Harvester", price: "₹2000/day", img: "Harvester.jpg", location: "Delhi"},
      {name: "Rotavator", price: "₹300/day", img: "Rotavator.jpg", location: "Delhi"},
      {name: "Seeder", price: "₹400/day", img: "seeder.jpg", location: "Mumbai"},
      {name: "Plough", price: "₹350/day", img: "plough.jpg", location: "Delhi"},
      {name: "Sprayer", price: "₹250/day", img: "sparayer.jpg", location: "Mumbai"},
      {name: "Baler", price: "₹1500/day", img: "baler.jpg", location: "Delhi"},
      {name: "Cultivator", price: "₹450/day", img: "cultivator.jpg", location: "Delhi"},
      {name: "Weeder", price: "₹200/day", img: "weeder.jpg", location: "Mumbai"},
      {name: "Water Pump", price: "₹300/day", img: "waterpump.jpg", location: "Delhi"},
      {name: "Thresher", price: "₹1200/day", img: "theresher.jpg", location: "Mumbai"},
      {name: "Trolley", price: "₹600/day", img: "trolley.jpg", location: "Delhi"},
      {name: "Power Tiller", price: "₹800/day", img: "tiller.jpg", location: "Delhi"},
      {name: "Reaper", price: "₹900/day", img: "reaper.jpg", location: "Mumbai"}
    ];
    
    // Combine API products with hardcoded data
    equipments = [...hardcodedEquipments, ...apiEquipments];
    console.log('Total equipments:', equipments.length);
    renderEquipments(equipments);
  } catch (error) {
    console.error('Failed to load equipments from API, using hardcoded data:', error);
    // Fallback to hardcoded data only
    const hardcodedEquipments = [
      {name: "Tractor", price: "₹500/day", img: "tractor.jpg", location: "Delhi"},
      {name: "Drone", price: "₹1000/day", img: "Drone.jpg", location: "Mumbai"},
      {name: "Harvester", price: "₹2000/day", img: "Harvester.jpg", location: "Delhi"},
      {name: "Rotavator", price: "₹300/day", img: "Rotavator.jpg", location: "Delhi"},
      {name: "Seeder", price: "₹400/day", img: "seeder.jpg", location: "Mumbai"},
      {name: "Plough", price: "₹350/day", img: "plough.jpg", location: "Delhi"},
      {name: "Sprayer", price: "₹250/day", img: "sparayer.jpg", location: "Mumbai"},
      {name: "Baler", price: "₹1500/day", img: "baler.jpg", location: "Delhi"},
      {name: "Cultivator", price: "₹450/day", img: "cultivator.jpg", location: "Delhi"},
      {name: "Weeder", price: "₹200/day", img: "weeder.jpg", location: "Mumbai"},
      {name: "Water Pump", price: "₹300/day", img: "waterpump.jpg", location: "Delhi"},
      {name: "Thresher", price: "₹1200/day", img: "theresher.jpg", location: "Mumbai"},
      {name: "Trolley", price: "₹600/day", img: "trolley.jpg", location: "Delhi"},
      {name: "Power Tiller", price: "₹800/day", img: "tiller.jpg", location: "Delhi"},
      {name: "Reaper", price: "₹900/day", img: "reaper.jpg", location: "Mumbai"}
    ];
    equipments = hardcodedEquipments;
    renderEquipments(equipments);
  }
}

// ---------- Cart Functions ----------
async function addToCart(index, withDriver = false) {
  if (!currentUser) {
    alert('Please login to add items to cart');
    return;
  }

  const item = currentRenderedList[index];
  if (!item) return;

  if (currentUser.role !== 'renter') {
    alert('Only users can rent equipment.');
    return;
  }

  const willHaveDriver = Boolean(item.hasDriver) && Boolean(withDriver);
  rented.push({ ...item, driverSelected: willHaveDriver });
  updateCart();
  
  // If item has an ID (from API), save to backend
  if (item.id) {
    try {
      await apiCall('/cart/add', {
        method: 'POST',
        body: JSON.stringify({
          userId: currentUser._id,
          productId: item.id
        })
      });
    } catch (error) {
      console.error('Failed to save cart to backend:', error);
    }
  }
}

async function removeFromCart(index) {
  const item = rented[index];
  rented.splice(index, 1);
  updateCart();
  
  // If item has an ID (from API), remove from backend
  if (item.id && currentUser) {
    try {
      await apiCall('/cart/remove', {
        method: 'POST',
        body: JSON.stringify({
          userId: currentUser._id,
          productId: item.id
        })
      });
    } catch (error) {
      console.error('Failed to remove from backend cart:', error);
    }
  }
}

// ---------- Favorites Functions ----------
async function addToFav(index) {
  if (!currentUser) {
    alert('Please login to add favorites');
    return;
  }

  if (currentUser.role !== 'renter') {
    alert('Only users can add favorites.');
    return;
  }

  const item = currentRenderedList[index];
  if (!item) return;

  favorites.push(item);
  updateFav();
  
  // If item has an ID (from API), save to backend
  if (item.id) {
    try {
      await apiCall('/favorites/toggle', {
        method: 'POST',
        body: JSON.stringify({
          userId: currentUser._id,
          productId: item.id
        })
      });
    } catch (error) {
      console.error('Failed to save favorite to backend:', error);
    }
  }
}

async function removeFromFav(index) {
  const item = favorites[index];
  favorites.splice(index, 1);
  updateFav();
  
  // If item has an ID (from API), remove from backend
  if (item.id && currentUser) {
    try {
      await apiCall('/favorites/toggle', {
        method: 'POST',
        body: JSON.stringify({
          userId: currentUser._id,
          productId: item.id
        })
      });
    } catch (error) {
      console.error('Failed to remove from backend favorites:', error);
    }
  }
}

// ---------- Render Functions ----------
function renderEquipments(list) {
  if (!equipmentList) return;

  const page = window.location.pathname.split('/').pop();
  const isAdmin = currentUser?.role === 'admin';
  // On Rent.html, show only admin-owned listings so delete/manage is clear.
  if (isAdmin && page === 'Rent.html' && currentUser?._id) {
    const adminId = String(currentUser._id);
    list = list.filter(item => item.ownerId && String(item.ownerId) === adminId);
  }
  
  currentRenderedList = list;
  equipmentList.innerHTML = "";
  list.forEach((item, index) => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.dataset.location = item.location.toLowerCase();
    // Admin can only delete products they own
    const canDelete = isAdmin && item.id && item.ownerId && String(currentUser?._id) === String(item.ownerId);
    const deleteBtn = canDelete ? `<button onclick="deleteProduct('${item.id}')">Delete</button>` : '';
    let rentBtns = '';
    if (!isAdmin) {
      // Always allow equipment-only rental
      rentBtns = `<button onclick="addToCart(${index}, false)">Rent Now</button>`;
      // If driver is available, allow extra driver rental
      if (item.hasDriver) {
        rentBtns += `<button onclick="addToCart(${index}, true)">Rent with Driver (+₹${item.driverPrice}/day)</button>`;
      }
    }
    const favBtn = !isAdmin ? `<button onclick="addToFav(${index})">❤️ Fav</button>` : '';
    const driverLine = item.hasDriver
      ? `<p><strong>Driver:</strong> Available (₹${item.driverPrice}/day)</p>`
      : `<p><strong>Driver:</strong> Not available</p>`;
    card.innerHTML = `
      <img src="${item.img}" alt="${item.name}">
      <h3>${item.name}</h3>
      <p>${item.price}</p>
      <p><strong>Location:</strong> ${item.location}</p>
      ${driverLine}
      ${rentBtns}
      ${favBtn}
      ${deleteBtn}
    `;
    equipmentList.appendChild(card);
  });
}

function updateCart() {
  if (!cartItems) return;
  
  cartItems.innerHTML = "";
  let total = 0;
  rented.forEach((item, index) => {
    const equipmentPrice = parseInt(item.price.replace(/[^\d]/g, "")) || 0;
    const driverExtra = item.driverSelected ? (parseInt(item.driverPrice) || 0) : 0;
    total += equipmentPrice + driverExtra;
    const li = document.createElement("li");
    const driverText = driverExtra > 0 ? ` + Driver ₹${driverExtra}/day` : '';
    li.innerHTML = `
      <img src="${item.img}" class="sidebar-img">
      <span>${item.name} - ${item.price}${driverText}</span>
      <button title="Remove" onclick="removeFromCart(${index})">&times;</button>
    `;
    cartItems.appendChild(li);
  });
  
  if (cartCount) cartCount.innerText = rented.length;
  if (totalBtn) totalBtn.innerText = "Total: ₹" + total;
}

function updateFav() {
  if (!favItems) return;
  
  favItems.innerHTML = "";
  favorites.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <img src="${item.img}" class="sidebar-img">
      <span>${item.name} - ${item.price}</span>
      <button title="Remove" onclick="removeFromFav(${index})">&times;</button>
    `;
    favItems.appendChild(li);
  });
  
  if (favCount) favCount.innerText = favorites.length;
}

function updateAuthUI() {
  const authButtonContainers = document.querySelectorAll('.auth-buttons');
  if (!authButtonContainers || authButtonContainers.length === 0) return;

  const loginModal = document.getElementById('loginForm');
  const signupModal = document.getElementById('signupForm');

  authButtonContainers.forEach((container) => {
    const isMobile = !!container.closest('.mobile-icons');

    if (currentUser) {
      container.innerHTML = `
        <span>Welcome, ${currentUser.name}</span>
        <button onclick="logout()">Logout</button>
      `;
      return;
    }

    // If the page doesn't contain auth modals, don't show login/signup (user can log in from index.html)
    if (!loginModal || !signupModal) {
      container.innerHTML = "";
      return;
    }

    const loginId = isMobile ? "mobile-loginBtn" : "loginBtn";
    const signupId = isMobile ? "mobile-signupBtn" : "signupBtn";

    container.innerHTML = `
      <button id="${loginId}">Login</button>
      <button id="${signupId}">Sign Up</button>
    `;

    container.querySelector(`#${loginId}`)?.addEventListener("click", () => {
      loginModal.style.display = "flex";
    });
    container.querySelector(`#${signupId}`)?.addEventListener("click", () => {
      signupModal.style.display = "flex";
    });
  });
}

// ---------- Toggle Functions ----------
function toggleCart() {
  const cartSidebar = document.getElementById("cart-sidebar");
  const favSidebar = document.getElementById("fav-sidebar");
  if (!cartSidebar) return;

  const willOpen = !cartSidebar.classList.contains("active");
  cartSidebar.classList.toggle("active");

  // Prevent both side panels from stacking on top of each other
  if (willOpen && favSidebar) favSidebar.classList.remove("active");
}

function toggleFav() {
  const favSidebar = document.getElementById("fav-sidebar");
  const cartSidebar = document.getElementById("cart-sidebar");
  if (!favSidebar) return;

  const willOpen = !favSidebar.classList.contains("active");
  favSidebar.classList.toggle("active");

  // Prevent both side panels from stacking on top of each other
  if (willOpen && cartSidebar) cartSidebar.classList.remove("active");
}

// ---------- Responsive Navbar ----------
function toggleMenu() {
  const mobileNav = document.getElementById('mobileNav');
  const hamburger = document.querySelector('.hamburger');
  
  if (mobileNav) {
    mobileNav.classList.toggle('show');
  }
  
  // Toggle hamburger animation
  if (hamburger) {
    hamburger.classList.toggle('active');
  }
  
  // Prevent body scroll when menu is open
  document.body.classList.toggle('menu-open');
}

// ---------- Payment Function ----------
function payNow() {
  if (rented.length === 0) {
    alert("No items in cart!");
    return;
  }
  alert("Payment successful for " + rented.length + " items!");
  rented = [];
  updateCart();
  toggleCart();
}

// ---------- Search Function ----------
function searchItem() {
  const input = document.querySelector(".search-bar input")?.value.toLowerCase().trim();
  if (!input) {
    renderEquipments(equipments);
    return;
  }
  
  const filtered = equipments.filter(item => 
    item.name.toLowerCase().includes(input) || 
    item.location.toLowerCase().includes(input)
  );
  renderEquipments(filtered);
}

// ---------- Theme Toggle ----------
function toggleTheme() {
  const body = document.body;
  const themeIcon = document.getElementById("theme-icon");
  if (body.classList.contains("dark-mode")) {
    body.classList.remove("dark-mode");
    body.classList.add("light-mode");
    themeIcon.classList.remove("fa-moon");
    themeIcon.classList.add("fa-sun");
  } else {
    body.classList.remove("light-mode");
    body.classList.add("dark-mode");
    themeIcon.classList.remove("fa-sun");
    themeIcon.classList.add("fa-moon");
  }
}

// ---------- Initialize App ----------
function initApp() {
  // Load user from localStorage
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
  }

  // Role-based routing:
  // - Admin must manage listings from Rent.html
  // - Non-admin users should never access Rent.html
  const page = window.location.pathname.split('/').pop();
  if (page === 'Rent.html') {
    if (!currentUser || currentUser.role !== 'admin') {
      alert('Only admin can access Rent Out Your Equipment.');
      window.location.href = 'index.html';
      return;
    }
  } else {
    if (currentUser?.role === 'admin') {
      window.location.href = 'Rent.html';
      return;
    }
  }
  
  // Load equipments
  loadEquipments();
  
  // Update UI
  updateAuthUI();
  updateCart();
  updateFav();
  
  // Set initial theme
  document.body.classList.add("light-mode");
}

// ---------- Login / Signup Modal Functions ----------
function setupAuthModals() {
  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const closeLogin = document.getElementById('closeLogin');
  const closeSignup = document.getElementById('closeSignup');

  if (loginBtn) loginBtn.addEventListener('click', () => loginForm.style.display = 'flex');
  if (signupBtn) signupBtn.addEventListener('click', () => signupForm.style.display = 'flex');
  if (closeLogin) closeLogin.addEventListener('click', () => loginForm.style.display = 'none');
  if (closeSignup) closeSignup.addEventListener('click', () => signupForm.style.display = 'none');
  
  window.addEventListener('click', (e) => {
    if (e.target === loginForm) loginForm.style.display = 'none';
    if (e.target === signupForm) signupForm.style.display = 'none';
  });

  // Login form submission
  const loginSubmitBtn = loginForm?.querySelector('button');
  if (loginSubmitBtn) {
    loginSubmitBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('input[type="text"]').value.trim();
      const role = loginForm.querySelector('#loginRole')?.value || "renter";
      const password = loginForm.querySelector('input[type="password"]').value.trim();
      
      if (!email || !password) {
        alert('Please fill all fields');
        return;
      }
      
      const result = await login(email, password, role);
      alert(result.message);
      
      if (result.success) {
        loginForm.style.display = 'none';
        updateAuthUI();
        if (currentUser?.role === 'admin') {
          window.location.href = 'Rent.html';
        }
      }
    });
  }

  // Signup form submission
  const signupSubmitBtn = signupForm?.querySelector('button');
  if (signupSubmitBtn) {
    signupSubmitBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const name = signupForm.querySelector('input[type="text"]').value.trim();
      const email = signupForm.querySelector('input[type="email"]').value.trim();
      const role = signupForm.querySelector('#signupRole')?.value || "renter";
      const password = signupForm.querySelector('input[type="password"]').value.trim();
      
      if (!name || !email || !password) {
        alert('Please fill all fields');
        return;
      }
      
      if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
      }
      
      const emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
      if (!emailPattern.test(email)) {
        alert('Please enter a valid email');
        return;
      }
      
      const result = await signup(name, email, password, role);
      alert(result.message);
      
      if (result.success) {
        signupForm.style.display = 'none';
        updateAuthUI();
        if (currentUser?.role === 'admin') {
          window.location.href = 'Rent.html';
        }
      }
    });
  }
}

// ---------- Rent Form Integration ----------
function setupRentForm() {
  const rentForm = document.getElementById("rentForm");
  const formMessage = document.getElementById("formMessage");

  if (rentForm) {
    // Driver fields: enable/disable driver price based on checkbox
    const driverToggle = document.getElementById("equipmentHasDriver");
    const driverPriceInput = document.getElementById("driverPrice");
    if (driverToggle && driverPriceInput) {
      driverPriceInput.disabled = !driverToggle.checked;
      driverToggle.addEventListener("change", () => {
        driverPriceInput.disabled = !driverToggle.checked;
      });
    }

    rentForm.addEventListener("submit", async function(e) {
      e.preventDefault();

      if (!currentUser) {
        alert('Please login to submit equipment for rent');
        return;
      }

      if (currentUser.role !== 'admin') {
        alert('Only admin can list equipment for rent.');
        return;
      }

      const name = document.getElementById("equipmentName").value;
      const price = document.getElementById("equipmentPrice").value;
      const location = document.getElementById("equipmentLocation").value;
      const hasDriver = document.getElementById("equipmentHasDriver")?.checked;
      const driverPriceRaw = document.getElementById("driverPrice")?.value;
      const image = document.getElementById("equipmentImage").files[0];

      if (!name || !price || !location || !image) {
        formMessage.style.color = "red";
        formMessage.textContent = "Please fill all fields!";
        return;
      }

      let driverPrice = 0;
      if (hasDriver) {
        const parsed = parseInt(driverPriceRaw);
        if (!driverPriceRaw || Number.isNaN(parsed) || parsed < 0) {
          formMessage.style.color = "red";
          formMessage.textContent = "Please enter a valid driver price (or uncheck driver).";
          return;
        }
        driverPrice = parsed;
      }

      // For now, we'll use a placeholder image URL
      // In a real app, you'd upload the image to a service like Cloudinary
      // Use base64 so it persists after refresh and can be shown on home page
      const fileToDataUrl = (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

      const imageUrl = await fileToDataUrl(image);

      try {
        const data = await apiCall('/rent/submit', {
          method: 'POST',
          body: JSON.stringify({
            userId: currentUser._id,
            name,
            price: parseInt(price),
            description: `${name} available for rent${hasDriver ? ' with driver' : ''}`,
            imageUrl,
            location,
            hasDriver,
            driverPrice
          })
        });

        formMessage.style.color = "green";
        formMessage.textContent = `${data.product.name} listed successfully!`;
        rentForm.reset();
        
        // Refresh the equipment list to show the new product
        await loadEquipments();
      } catch (error) {
        formMessage.style.color = "red";
        formMessage.textContent = error.message || "Something went wrong!";
      }
    });
  }
}

// ---------- Close mobile menu when clicking outside ----------
function setupMobileMenuClose() {
  document.addEventListener('click', function(event) {
    const mobileNav = document.getElementById('mobileNav');
    const hamburger = document.querySelector('.hamburger');
    
    if (mobileNav && mobileNav.classList.contains('show')) {
      // Check if click is outside mobile menu and hamburger
      if (!mobileNav.contains(event.target) && !hamburger.contains(event.target)) {
        mobileNav.classList.remove('show');
        document.body.classList.remove('menu-open');
        if (hamburger) hamburger.classList.remove('active');
      }
    }
  });
  
  // Close menu when clicking on navigation links
  const mobileNavLinks = document.querySelectorAll('.mobile-nav a');
  mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      const mobileNav = document.getElementById('mobileNav');
      const hamburger = document.querySelector('.hamburger');
      if (mobileNav) mobileNav.classList.remove('show');
      if (hamburger) hamburger.classList.remove('active');
      document.body.classList.remove('menu-open');
    });
  });
}

// ---------- Initialize when DOM is loaded ----------
document.addEventListener('DOMContentLoaded', function() {
  initApp();
  setupAuthModals();
  setupRentForm();
  setupMobileMenuClose();
});

// Export functions for global access
window.rentNow = addToCart;
window.addToFav = addToFav;
window.removeItem = removeFromCart;
window.removeFav = removeFromFav;
window.toggleCart = toggleCart;
window.toggleFav = toggleFav;
window.toggleMenu = toggleMenu;
window.payNow = payNow;
window.searchItem = searchItem;
window.toggleTheme = toggleTheme;
window.logout = logout;
window.deleteProduct = async function(id) {
  if (!currentUser) {
    alert('Please login to delete products');
    return;
  }
  if (!confirm('Delete this product?')) return;
  try {
    await apiCall(`/card/${id}`, { method: 'DELETE' });
    await loadEquipments();
    alert('Deleted');
  } catch (e) {
    alert(e.message || 'Failed to delete');
  }
}
