// 🔐 src/auth/auth.js

// ✅ 1. Import required Firebase libraries
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

// ✅ 2. Your Firebase configuration object
// ⚠️ Replace this with your actual config if using a different Firebase project
const firebaseConfig = {
  apiKey: "AIzaSyCmojvuVeIq65hyjl2eRGIbJGYX_Dj5qoY",
  authDomain: "learningfirebase-a6920.firebaseapp.com",
  projectId: "learningfirebase-a6920",
  storageBucket: "learningfirebase-a6920.firebasestorage.app",
  messagingSenderId: "652165788251",
  appId: "1:652165788251:web:aa3f3e077371b4632a057e",
  measurementId: "G-KJXPQTDS51"
};

// ✅ 3. Initialize Firebase and the Auth service
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ✅ 4. Export functions so other files (like main.js) can use them

/**
 * 🔐 Register a new user with email and password
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<UserCredential>}
 */
export function signUp(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

/**
 * 🔐 Log in an existing user
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<UserCredential>}
 */
export function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * 🚪 Log the user out
 * @returns {Promise<void>}
 */
export function logout() {
  return signOut(auth);
}

/**
 * 👀 Watch for login/logout status changes
 * @param {function} callback - Function to run when the user logs in or out
 */
export function onAuthChange(callback) {
  onAuthStateChanged(auth, callback);
}
