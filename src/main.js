// src/main.js
// ✅ 1. Import global styles
import "./styles/style.css";

// ✅ 2. Import modal styles
import "./styles/modal.css";

// ✅ 3. Import Firebase auth functions
import { signUp, login, logout, onAuthChange } from "./auth/auth.js";

// ✅ 4. Track login status
let currentUser = null;

// ✅ 5. Run after page fully loads
window.onload = () => {
  /* 🎯 Grab needed DOM elements */
  const emailInput   = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const signupBtn    = document.getElementById("signup");
  const loginBtn     = document.getElementById("login");
  const logoutBtn    = document.getElementById("logout");
  const statusText   = document.getElementById("status");
  const closeBtn     = document.getElementById("close-modal");
  const homeLink     = document.getElementById("home-link"); // ← NEW (uses the id)

  /* === Modal helpers === */
  const showLoginModal = () =>
    document.getElementById("login-modal").classList.remove("hidden");

  const hideLoginModal = () =>
    document.getElementById("login-modal").classList.add("hidden");

  /* === Sign-up === */
  signupBtn.onclick = () => {
    const email    = emailInput.value;
    const password = passwordInput.value;

    signUp(email, password)
      .then(({ user }) => (statusText.textContent = `Signed up: ${user.email}`))
      .catch((err) => alert("Signup Error: " + err.message));
  };

  /* === Login === */
  loginBtn.onclick = () => {
    const email    = emailInput.value;
    const password = passwordInput.value;

    login(email, password)
      .then(({ user }) => (statusText.textContent = `Logged in: ${user.email}`))
      .catch((err) => alert("Login Error: " + err.message));
  };

  /* === Logout === */
  logoutBtn.onclick = () => {
    logout()
      .then(() => (statusText.textContent = "Logged out"))
      .catch((err) => alert("Logout Error: " + err.message));
  };

  /* === Track auth state === */
  onAuthChange((user) => {
    currentUser = user;

    if (user) {
      statusText.textContent = `Logged in: ${user.email}`;
      logoutBtn.style.display = "inline-block";
    } else {
      statusText.textContent = "Not logged in";
      logoutBtn.style.display = "none";
    }
  });

  /* === Intercept Home link === */
  homeLink.addEventListener("click", (e) => {
    e.preventDefault(); // stop default jump

    if (!currentUser) {
      /* 🚫 Not logged in → show modal */
      showLoginModal();
    } else {
      /* ✅ Logged in → go to dashboard */
      window.location.href = "/src/pages/dashboard.html";
    }
  });

  /* === Close (X) on modal === */
  closeBtn.onclick = hideLoginModal;
};

