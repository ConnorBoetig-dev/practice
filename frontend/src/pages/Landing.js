// I'm creating the landing page component that handles login and signup functionality.
// This replaces your index.html and includes all the auth logic from your main.js file.

import React, { useState } from 'react';
import { authService } from '../services/firebase';
import './Landing.css';

const Landing = ({ user, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('Not logged in');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState({ signup: false, login: false, logout: false });

  // I'm creating a helper function to show status messages
  const showStatus = (message, error = false) => {
    setStatus(message);
    setIsError(error);
  };

  // I'm clearing the input fields after successful operations
  const clearInputs = () => {
    setEmail('');
    setPassword('');
  };

  // I'm handling the signup process
  const handleSignup = async () => {
    if (!email.trim() || !password) {
      showStatus('Please enter email and password', true);
      return;
    }

    setLoading(prev => ({ ...prev, signup: true }));

    try {
      const result = await authService.signUp(email, password);

      if (result.success) {
        showStatus(`Account created! Welcome ${result.user.email}`);
        clearInputs();
        onLoginSuccess?.();
      } else {
        // I'm providing user-friendly error messages
        let errorMessage = 'Signup failed: ';

        switch (result.error) {
          case 'auth/email-already-in-use':
            errorMessage += 'This email is already registered';
            break;
          case 'auth/weak-password':
            errorMessage += 'Password should be at least 6 characters';
            break;
          case 'auth/invalid-email':
            errorMessage += 'Please enter a valid email address';
            break;
          default:
            errorMessage += result.message;
        }

        showStatus(errorMessage, true);
      }
    } catch (error) {
      showStatus('Signup failed: ' + error.message, true);
    } finally {
      setLoading(prev => ({ ...prev, signup: false }));
    }
  };

  // I'm handling the login process
  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showStatus('Please enter email and password', true);
      return;
    }

    setLoading(prev => ({ ...prev, login: true }));

    try {
      const result = await authService.login(email, password);

      if (result.success) {
        showStatus(`Welcome back, ${result.user.email}!`);
        clearInputs();
        onLoginSuccess?.();
      } else {
        // I'm providing user-friendly error messages
        let errorMessage = 'Login failed: ';

        switch (result.error) {
          case 'auth/user-not-found':
            errorMessage += 'No account found with this email';
            break;
          case 'auth/wrong-password':
            errorMessage += 'Incorrect password';
            break;
          case 'auth/invalid-email':
            errorMessage += 'Please enter a valid email address';
            break;
          default:
            errorMessage += result.message;
        }

        showStatus(errorMessage, true);
      }
    } catch (error) {
      showStatus('Login failed: ' + error.message, true);
    } finally {
      setLoading(prev => ({ ...prev, login: false }));
    }
  };

  // I'm handling the logout process
  const handleLogout = async () => {
    setLoading(prev => ({ ...prev, logout: true }));

    try {
      const result = await authService.logout();

      if (result.success) {
        showStatus('Successfully logged out');
      } else {
        showStatus('Logout failed: ' + result.message, true);
      }
    } catch (error) {
      showStatus('Logout failed: ' + error.message, true);
    } finally {
      setLoading(prev => ({ ...prev, logout: false }));
    }
  };

  // I'm handling Enter key press for quick login
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      if (user) {
        handleLogout();
      } else {
        handleLogin();
      }
    }
  };

  return (
    <div className="container">
      <h1>Welcome to ConLearn! 🚀</h1>
      <p>Your AI-powered learning companion</p>

      <div className="auth-section">
        <h2>Get Started</h2>

        {/* I'm showing the auth form only when user is not logged in */}
        {!user && (
          <>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="auth-input"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your password"
              className="auth-input"
            />
          </>
        )}

        <div className="button-group">
          {user ? (
            <button
              onClick={handleLogout}
              disabled={loading.logout}
              className="auth-btn"
            >
              {loading.logout ? 'Logging out...' : 'Logout'}
            </button>
          ) : (
            <>
              <button
                onClick={handleSignup}
                disabled={loading.signup}
                className="auth-btn"
              >
                {loading.signup ? 'Creating account...' : 'Sign Up'}
              </button>
              <button
                onClick={handleLogin}
                disabled={loading.login}
                className="auth-btn"
              >
                {loading.login ? 'Logging in...' : 'Log In'}
              </button>
            </>
          )}
        </div>

        <p className={`status-text ${isError ? 'error' : ''}`}>
          {user ? `Logged in as: ${user.email}` : status}
        </p>
      </div>
    </div>
  );
};

export default Landing;
