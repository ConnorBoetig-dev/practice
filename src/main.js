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
  // 🎯 Get all the DOM elements
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const signupBtn = document.getElementById("signup");
  const loginBtn = document.getElementById("login");
  const logoutBtn = document.getElementById("logout");
  const statusText = document.getElementById("status");
  const closeBtn = document.getElementById("close-modal");
  const homeLink = document.querySelector("a[href='#']");

  // ✅ Show modal
  function showLoginModal() {
    const modal = document.getElementById("login-modal");
    modal.classList.remove("hidden");
  }

  // ❌ Hide modal
  function hideLoginModal() {
    const modal = document.getElementById("login-modal");
    modal.classList.add("hidden");
  }

  // 🖱️ Sign Up button
  signupBtn.onclick = () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    signUp(email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        statusText.textContent = `Signed up: ${user.email}`;
      })
      .catch((error) => {
        alert("Signup Error: " + error.message);
      });
  };

  // 🖱️ Login button
  loginBtn.onclick = () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    login(email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        statusText.textContent = `Logged in: ${user.email}`;
      })
      .catch((error) => {
        alert("Login Error: " + error.message);
      });
  };

  // 🚪 Logout button
  logoutBtn.onclick = () => {
    logout()
      .then(() => {
        statusText.textContent = "Logged out";
      })
      .catch((error) => {
        alert("Logout Error: " + error.message);
      });
  };

  // 🔁 Auth state listener
  onAuthChange((user) => {
    currentUser = user; // 💾 update tracker
    if (user) {
      statusText.textContent = `Logged in: ${user.email}`;
      logoutBtn.style.display = "inline-block";
    } else {
      statusText.textContent = "Not logged in";
      logoutBtn.style.display = "none";
    }
  });

  // 🟥 Intercept "Home" click if not logged in
  homeLink.addEventListener("click", (e) => {
    e.preventDefault(); // ⛔ Stop page jump
    if (!currentUser) {
      showLoginModal();
    } else {
      alert("You are already logged in!");
    }
  });

  // ❌ Handle close "X" on modal
  closeBtn.onclick = hideLoginModal;
};
