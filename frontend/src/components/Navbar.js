// I'm creating the navigation bar component that handles routing and auth state display.
// This replaces the navbar section from your HTML files and provides React Router navigation.

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/firebase';
import './Navbar.css';

const Navbar = ({ user, onLoginClick }) => {
  const navigate = useNavigate();

  // I'm handling navigation clicks that might require authentication
  const handleProtectedNavigation = (path) => {
    if (!user) {
      onLoginClick();
    } else {
      navigate(path);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="logo">
        <Link to="/">ConLearn</Link>
      </div>

      <ul className="nav-links">
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <button
            onClick={() => handleProtectedNavigation('/dashboard')}
            className="nav-button"
          >
            Dashboard
          </button>
        </li>
        <li>
          <a href="#about">About</a>
        </li>

        {/* I'm showing user-specific options when logged in */}
        {user && (
          <li className="user-section">
            <span className="user-email">{user.email}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </li>
        )}

        {/* I'm showing login option when not logged in */}
        {!user && (
          <li>
            <button onClick={onLoginClick} className="login-btn">
              Login
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
