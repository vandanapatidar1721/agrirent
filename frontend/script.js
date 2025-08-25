const equipments = [
  {name: "Tractor", price: "₹500/day", img: "tractor.jpg"},
  {name: "Drone", price: "₹1000/day", img: "Drone.jpg"},
  {name: "Harvester", price: "₹2000/day", img: "Harvester.jpg"},
  {name: "Rotavator", price: "₹300/day", img: "Rotavator.jpg"},
  {name: "Seeder", price: "₹400/day", img: "seeder.jpg"},
  {name: "Plough", price: "₹350/day", img: "plough.jpg"},
  {name: "Sprayer", price: "₹250/day", img: "sparayer.jpg"},
  {name: "Baler", price: "₹1500/day", img: "baler.jpg"},
  {name: "Cultivator", price: "₹450/day", img: "cultivator.jpg"},
  {name: "Weeder", price: "₹200/day", img: "weeder.jpg"},
  {name: "Water Pump", price: "₹300/day", img: "waterpump.jpg"},
  {name: "Thresher", price: "₹1200/day", img: "theresher.jpg"},
  {name: "Trolley", price: "₹600/day", img: "trolley.jpg"},
  {name: "Power Tiller", price: "₹800/day", img: "tiller.jpg"},
  {name: "Reaper", price: "₹900/day", img: "reaper.jpg"}
];

const equipmentList = document.getElementById("equipment-list");
const cartItems = document.getElementById("cart-items");
const favItems = document.getElementById("fav-items");
const cartCount = document.getElementById("cart-count");
const favCount = document.getElementById("fav-count");
const totalBtn = document.getElementById("total-btn");

let rented = [];
let favorites = [];

// Render Equipments
equipments.forEach(item => {
  const card = document.createElement("div");
  card.classList.add("card");
  card.innerHTML = `
    <img src="${item.img}" alt="${item.name}">
    <h3>${item.name}</h3>
    <p>${item.price}</p>
    <button onclick="rentNow('${item.name}', '${item.price}')">Rent Now</button>
    <button onclick="addToFav('${item.name}', '${item.price}')">❤️ Fav</button>
  `;
  equipmentList.appendChild(card);
});

// Rent Now Action
function rentNow(name, price){
  rented.push({name, price});
  updateCart();
}

// Update Cart
function updateCart(){
  cartItems.innerHTML = "";
  let total = 0;
  rented.forEach((item, index) => {
    const priceValue = parseInt(item.price.replace(/[^\d]/g, ""));
    total += priceValue;
    const li = document.createElement("li");
    li.innerHTML = `
      ${item.name} - ${item.price}
      <button onclick="removeItem(${index})">Remove</button>
    `;
    cartItems.appendChild(li);
  });
  cartCount.innerText = rented.length;
  totalBtn.innerText = "Total: ₹" + total;
}

// Remove item
function removeItem(index){
  rented.splice(index, 1);
  updateCart();
}

// Toggle Cart Sidebar
function toggleCart(){
  document.getElementById("cart-sidebar").classList.toggle("active");
}

// Pay Now
function payNow(){
  if(rented.length === 0){
    alert("No items in cart!");
    return;
  }
  alert("Payment successful for " + rented.length + " items!");
  rented = [];
  updateCart();
  toggleCart();
}

// Add to Favorite
function addToFav(name, price){
  favorites.push({name, price});
  updateFav();
}
// Update Favorite
function updateFav(){
  favItems.innerHTML = "";
  favorites.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${item.name} - ${item.price}
      <button onclick="removeFav(${index})">Remove</button>
    `;
    favItems.appendChild(li);
  });
  favCount.innerText = favorites.length;
}

// Remove Favorite
function removeFav(index){
  favorites.splice(index, 1);
  updateFav();
}

// Toggle Favorite Sidebar
function toggleFav(){
  document.getElementById("fav-sidebar").classList.toggle("active");
}

// Search Filter
function searchItem(){
  const input = document.querySelector(".search-bar input").value.toLowerCase();
  const cards = document.querySelectorAll(".card");
  cards.forEach(card => {
    const title = card.querySelector("h3").innerText.toLowerCase();
    card.style.display = title.includes(input) ? "block" : "none";
  });
}


// Theme Toggle
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

// Default Light Mode
document.body.classList.add("light-mode");



// Get buttons and modals
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const closeLogin = document.getElementById('closeLogin');
const closeSignup = document.getElementById('closeSignup');

// Open modals
loginBtn.addEventListener('click', () => loginForm.style.display = 'flex');
signupBtn.addEventListener('click', () => signupForm.style.display = 'flex');

// Close modals
closeLogin.addEventListener('click', () => loginForm.style.display = 'none');
closeSignup.addEventListener('click', () => signupForm.style.display = 'none');

// Close if clicked outside
window.addEventListener('click', (e) => {
  if (e.target === loginForm) loginForm.style.display = 'none';
  if (e.target === signupForm) signupForm.style.display = 'none';
});

// **Handle Login Submit with Validation**
const loginSubmit = loginForm.querySelector('button');
loginSubmit.addEventListener('click', (e) => {
  e.preventDefault();
  const username = loginForm.querySelector('input[type="text"]').value.trim();
  const password = loginForm.querySelector('input[type="password"]').value.trim();

  if (!username || !password) {
    alert('❌ Please fill all fields');
    return;
  }

  if (password.length < 6) {
    alert('❌ Password must be at least 6 characters');
    return;
  }

  alert('✅ Login Successful');
  loginForm.style.display = 'none';
});

// **Handle Sign Up Submit with Validation**
const signupSubmit = signupForm.querySelector('button');
signupSubmit.addEventListener('click', (e) => {
  e.preventDefault();
  const username = signupForm.querySelector('input[type="text"]').value.trim();
  const email = signupForm.querySelector('input[type="email"]').value.trim();
  const password = signupForm.querySelector('input[type="password"]').value.trim();

  if (!username || !email || !password) {
    alert('❌ Please fill all fields');
    return;
  }

  if (password.length < 6) {
    alert('❌ Password must be at least 6 characters');
    return;
  }

  // Simple email format check
  const emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
  if (!emailPattern.test(email)) {
    alert('❌ Please enter a valid email');
    return;
  }

  alert('✅ Sign Up Successful');
  signupForm.style.display = 'none';
});

// why us








