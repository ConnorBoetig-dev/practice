// I'm creating the login modal component that prompts users to log in when accessing protected routes.
// This replaces the modal functionality from your original HTML and provides a clean React implementation.

import React, { useState } from 'react';
import { authService } from '../services/firebase';
import './LoginModal.css';

const LoginModal = ({ onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // I'm handling the login process within the modal
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      setError('Please enter email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await authService.login(email, password);

      if (result.success) {
        onLoginSuccess();
        onClose();
      } else {
        // I'm providing user-friendly error messages
        let errorMessage = '';

        switch (result.error) {
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address';
            break;
          default:
            errorMessage = result.message;
        }

        setError(errorMessage);
      }
    } catch (error) {
      setError('Login failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // I'm handling clicks on the backdrop to close the modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // I'm handling the Escape key to close the modal
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="modal"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex="-1"
    >
      <div className="modal-content">
        <button
          className="close-button"
          onClick={onClose}
          aria-label="Close modal"
        >
          ✖
        </button>

        <h3>Please Log In</h3>
        <p>You need to be logged in to access this page</p>

        <form onSubmit={handleLogin} className="modal-form">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="modal-input"
            disabled={isLoading}
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="modal-input"
            disabled={isLoading}
          />

          {error && (
            <div className="modal-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="modal-login-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="modal-signup-prompt">
          Don't have an account? <button
            onClick={onClose}
            className="signup-link"
          >
            Go to main page to sign up
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginModal;
