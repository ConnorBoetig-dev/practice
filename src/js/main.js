// 🎯 src/js/main.js - Main JavaScript file
// This runs when the page loads and connects everything together

// 🏁 Wait for the page to fully load before running our code
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 ConLearn app starting...');
  
  // 📦 Get references to all our HTML elements
  // Think of these like handles to grab onto page elements
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const signupBtn = document.getElementById('signup');
  const loginBtn = document.getElementById('login');
  const logoutBtn = document.getElementById('logout');
  const statusText = document.getElementById('status');
  const loginModal = document.getElementById('login-modal');
  const closeModalBtn = document.getElementById('close-modal');
  const homeLink = document.getElementById('home-link');
  const dashboardLink = document.getElementById('dashboard-link');
  const modalLoginBtn = document.querySelector('.modal-login-btn');
  
  // 🔐 Track if user is logged in
  let currentUser = null;
  
  // ✨ Helper Functions (little tools we use repeatedly)
  
  /**
   * 📢 Show a message to the user
   */
  function showStatus(message, isError = false) {
    statusText.textContent = message;
    statusText.style.color = isError ? '#ff4444' : '#00ff00';
  }
  
  /**
   * 🎭 Show the login modal
   */
  function showLoginModal() {
    loginModal.classList.remove('hidden');
  }
  
  /**
   * 🎭 Hide the login modal
   */
  function hideLoginModal() {
    loginModal.classList.add('hidden');
  }
  
  /**
   * 🧹 Clear the input fields
   */
  function clearInputs() {
    emailInput.value = '';
    passwordInput.value = '';
  }
  
  // 🎯 Event Handlers (what happens when buttons are clicked)
  
  /**
   * 📝 Handle Sign Up
   */
  signupBtn.addEventListener('click', async function() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Check if fields are filled
    if (!email || !password) {
      showStatus('Please enter email and password', true);
      return;
    }
    
    try {
      // Disable button while processing
      signupBtn.disabled = true;
      signupBtn.textContent = 'Creating account...';
      
      // Call Firebase to create account
      const result = await window.authFunctions.signUp(email, password);
      showStatus(`Account created! Welcome ${result.user.email}`);
      clearInputs();
      
    } catch (error) {
      // Show user-friendly error messages
      let errorMessage = 'Signup failed: ';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage += 'This email is already registered';
      } else if (error.code === 'auth/weak-password') {
        errorMessage += 'Password should be at least 6 characters';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage += 'Please enter a valid email address';
      } else {
        errorMessage += error.message;
      }
      
      showStatus(errorMessage, true);
    } finally {
      // Re-enable button
      signupBtn.disabled = false;
      signupBtn.textContent = 'Sign Up';
    }
  });
  
  /**
   * 🔑 Handle Login
   */
  loginBtn.addEventListener('click', async function() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Check if fields are filled
    if (!email || !password) {
      showStatus('Please enter email and password', true);
      return;
    }
    
    try {
      // Disable button while processing
      loginBtn.disabled = true;
      loginBtn.textContent = 'Logging in...';
      
      // Call Firebase to log in
      const result = await window.authFunctions.login(email, password);
      showStatus(`Welcome back, ${result.user.email}!`);
      clearInputs();
      
    } catch (error) {
      // Show user-friendly error messages
      let errorMessage = 'Login failed: ';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage += 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage += 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage += 'Please enter a valid email address';
      } else {
        errorMessage += error.message;
      }
      
      showStatus(errorMessage, true);
    } finally {
      // Re-enable button
      loginBtn.disabled = false;
      loginBtn.textContent = 'Log In';
    }
  });
  
  /**
   * 🚪 Handle Logout
   */
  logoutBtn.addEventListener('click', async function() {
    try {
      await window.authFunctions.logout();
      showStatus('Successfully logged out');
    } catch (error) {
      showStatus('Logout failed: ' + error.message, true);
    }
  });
  
  /**
   * 🏠 Handle Home Link Click
   */
  homeLink.addEventListener('click', function(event) {
    event.preventDefault(); // Stop the link from navigating
    
    if (!currentUser) {
      showLoginModal();
    } else {
      // User is logged in, could navigate to home page
      showStatus('Welcome home!');
    }
  });
  
  /**
   * 📊 Handle Dashboard Link Click
   */
  dashboardLink.addEventListener('click', function(event) {
    event.preventDefault(); // Stop the link from navigating
    
    if (!currentUser) {
      showLoginModal();
    } else {
      // User is logged in, go to dashboard
      window.location.href = 'src/pages/dashboard.html';
    }
  });
  
  /**
   * ❌ Handle Modal Close Button
   */
  closeModalBtn.addEventListener('click', hideLoginModal);
  
  /**
   * 🔐 Handle Modal Login Button
   */
  modalLoginBtn.addEventListener('click', function() {
    hideLoginModal();
    emailInput.focus(); // Put cursor in email field
  });
  
  /**
   * 🎭 Close modal if user clicks outside of it
   */
  loginModal.addEventListener('click', function(event) {
    if (event.target === loginModal) {
      hideLoginModal();
    }
  });
  
  // 👀 Watch for auth state changes
  // This runs whenever user logs in or out
  window.authFunctions.onAuthChange(function(user) {
    currentUser = user;
    
    if (user) {
      // User is logged in
      showStatus(`Logged in as: ${user.email}`);
      logoutBtn.style.display = 'inline-block';
      
      // Hide login/signup buttons
      signupBtn.style.display = 'none';
      loginBtn.style.display = 'none';
      
    } else {
      // User is logged out
      showStatus('Not logged in');
      logoutBtn.style.display = 'none';
      
      // Show login/signup buttons
      signupBtn.style.display = 'inline-block';
      loginBtn.style.display = 'inline-block';
    }
  });
  
  // ⌨️ Allow Enter key to submit login
  passwordInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      if (currentUser) {
        logoutBtn.click();
      } else {
        loginBtn.click();
      }
    }
  });
});