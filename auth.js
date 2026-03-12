/* ================================
   AUTH SYSTEM (No Firebase, No DB)
   Works using LocalStorage
==================================*/

// Keys
const USERS_KEY = "SEHATGUIDE_USERS";
const SESSION_KEY = "SEHATGUIDE_SESSION";

// -------------------------------
// Helpers
// -------------------------------
function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function getSession() {
  return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function showMsg(id, text, type = "error") {
  const el = document.getElementById(id);
  if (!el) return;

  el.style.display = "block";
  el.innerText = text;

  if (type === "success") {
    el.style.background = "rgba(0,255,150,0.12)";
    el.style.border = "1px solid rgba(0,255,150,0.35)";
    el.style.color = "#7CFFCF";
  } else {
    el.style.background = "rgba(255,0,80,0.12)";
    el.style.border = "1px solid rgba(255,0,80,0.35)";
    el.style.color = "#FF9BB8";
  }
}

// -------------------------------
// Create default admin if none
// -------------------------------
(function createDefaultAdmin() {
  let users = getUsers();

  const adminExists = users.some((u) => u.role === "admin");
  if (!adminExists) {
    users.push({
      name: "Admin",
      email: "admin@sehatguide.ai",
      password: "admin123",
      role: "admin",
      createdAt: new Date().toISOString(),
    });
    saveUsers(users);
  }
})();

// -------------------------------
// Signup
// -------------------------------
function signupUser(e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();

  if (!name || !email || !password || !confirmPassword) {
    showMsg("msgBox", "⚠️ Please fill all fields!");
    return;
  }

  if (password.length < 5) {
    showMsg("msgBox", "⚠️ Password must be at least 5 characters!");
    return;
  }

  if (password !== confirmPassword) {
    showMsg("msgBox", "⚠️ Passwords do not match!");
    return;
  }

  let users = getUsers();

  const exists = users.some((u) => u.email === email);
  if (exists) {
    showMsg("msgBox", "❌ This email is already registered!");
    return;
  }

  // Create new user
  const newUser = {
    name,
    email,
    password,
    role: "user",
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  showMsg("msgBox", "✅ Signup successful! Redirecting to Login...", "success");

  setTimeout(() => {
    window.location.href = "login.html";
  }, 1200);
}

// -------------------------------
// Login
// -------------------------------
function loginUser(e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    showMsg("msgBox", "⚠️ Please enter email and password!");
    return;
  }

  const users = getUsers();
  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    showMsg("msgBox", "❌ Invalid email or password!");
    return;
  }

  // Store session
  setSession({
    name: user.name,
    email: user.email,
    role: user.role,
    loginTime: new Date().toISOString(),
  });

  showMsg("msgBox", "✅ Login successful! Redirecting...", "success");

  setTimeout(() => {
    window.location.href = "index.html";
  }, 900);
}

// -------------------------------
// Logout
// -------------------------------
function logout() {
  clearSession();
  window.location.href = "login.html";
}

// -------------------------------
// Protect Pages
// -------------------------------
function protectPage() {
  const session = getSession();
  if (!session) {
    window.location.href = "login.html";
  }
}

// -------------------------------
// Current user
// -------------------------------
function getCurrentUser() {
  return getSession();
}

// -------------------------------
// Admin Only Feature Guard
// -------------------------------
function adminOnly() {
  const session = getSession();
  return session && session.role === "admin";
}
