// I'm creating the main App component that handles routing and global auth state.
// This replaces your index.html navigation and serves as the root of our React app.

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import LoginModal from './components/LoginModal';
import { auth } from './services/firebase';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // I'm listening for auth state changes when the app loads
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // I'm creating a protected route wrapper that shows login modal if not authenticated
  const ProtectedRoute = ({ children }) => {
    if (loading) {
      return <div className="loading">Loading...</div>;
    }

    if (!user) {
      setShowLoginModal(true);
      return <Navigate to="/" replace />;
    }

    return children;
  };

  if (loading) {
    return <div className="loading">Loading ConLearn...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Navbar
          user={user}
          onLoginClick={() => setShowLoginModal(true)}
        />

        <Routes>
          <Route
            path="/"
            element={
              <Landing
                user={user}
                onLoginSuccess={() => setShowLoginModal(false)}
              />
            }
          />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard user={user} />
              </ProtectedRoute>
            }
          />
        </Routes>

        {showLoginModal && (
          <LoginModal
            onClose={() => setShowLoginModal(false)}
            onLoginSuccess={() => setShowLoginModal(false)}
          />
        )}
      </div>
    </Router>
  );
}

export default App;
