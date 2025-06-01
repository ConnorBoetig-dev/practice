// I'm setting up Firebase configuration and auth services for our React app.
// This replaces your original auth.js and provides clean auth functions that work with React hooks.

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

// I'm using your existing Firebase config - in production, you'd want these in environment variables
const firebaseConfig = {
  apiKey: "AIzaSyCmojvuVeIq65hyjl2eRGIbJGYX_Dj5qoY",
  authDomain: "learningfirebase-a6920.firebaseapp.com",
  projectId: "learningfirebase-a6920",
  storageBucket: "learningfirebase-a6920.firebasestorage.app",
  messagingSenderId: "652165788251",
  appId: "1:652165788251:web:aa3f3e077371b4632a057e",
  measurementId: "G-KJXPQTDS51"
};

// I'm initializing Firebase app and auth
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// I'm creating clean auth functions that return promises for easy use with React
export const authService = {
  // I'm handling user signup
  signUp: async (email, password) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error.code, message: error.message };
    }
  },

  // I'm handling user login
  login: async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error.code, message: error.message };
    }
  },

  // I'm handling user logout
  logout: async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.code, message: error.message };
    }
  },

  // I'm providing access to the auth state listener
  onAuthStateChanged: (callback) => {
    return onAuthStateChanged(auth, callback);
  },

  // I'm providing access to current user
  getCurrentUser: () => {
    return auth.currentUser;
  }
};

export default authService;
