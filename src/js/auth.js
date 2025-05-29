// 🔐 src/js/auth.js - Firebase Authentication Helper
// This file handles all the Firebase auth stuff

// ✅ Your Firebase configuration
// IMPORTANT: In a real app, you'd want to hide these in environment variables
// But for learning, it's OK to have them here (these are public keys anyway)
const firebaseConfig = {
  apiKey: "AIzaSyCmojvuVeIq65hyjl2eRGIbJGYX_Dj5qoY",
  authDomain: "learningfirebase-a6920.firebaseapp.com",
  projectId: "learningfirebase-a6920",
  storageBucket: "learningfirebase-a6920.firebasestorage.app",
  messagingSenderId: "652165788251",
  appId: "1:652165788251:web:aa3f3e077371b4632a057e",
  measurementId: "G-KJXPQTDS51"
};

// ✅ Initialize Firebase (only if not already initialized)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// ✅ Get the auth service
const auth = firebase.auth();

// 🔥 Make our auth functions available globally
// This means other scripts can use window.authFunctions.signUp(), etc.
window.authFunctions = {
  /**
   * 🔐 Sign up a new user
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise} - Resolves with user info or rejects with error
   */
  signUp: function(email, password) {
    return auth.createUserWithEmailAndPassword(email, password);
  },

  /**
   * 🔑 Log in existing user
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise} - Resolves with user info or rejects with error
   */
  login: function(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
  },

  /**
   * 🚪 Log out current user
   * @returns {Promise} - Resolves when logged out
   */
  logout: function() {
    return auth.signOut();
  },

  /**
   * 👀 Listen for auth state changes
   * @param {Function} callback - Function to run when auth state changes
   */
  onAuthChange: function(callback) {
    return auth.onAuthStateChanged(callback);
  },

  /**
   * 🎫 Get current user
   * @returns {Object|null} - Current user object or null if not logged in
   */
  getCurrentUser: function() {
    return auth.currentUser;
  }
};

// 🎯 Also make auth object available globally for advanced uses
window.firebaseAuth = auth;