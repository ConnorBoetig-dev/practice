// I'm creating a simple home page component that serves as a protected welcome area.
// This replaces your homebase.html and provides a clean landing spot for authenticated users.

import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = ({ user }) => {
  return (
    <div className="home-container">
      <div className="welcome-content">
        <h1>Welcome to your Dashboard</h1>
        <p>You're successfully logged in!</p>

        <div className="user-greeting">
          <h2>Hello, {user?.email}! 👋</h2>
          <p>What would you like to do today?</p>
        </div>

        <div className="action-cards">
          <Link to="/dashboard" className="action-card">
            <div className="card-icon">📊</div>
            <h3>Go to Dashboard</h3>
            <p>Upload and manage your files</p>
          </Link>

          <div className="action-card coming-soon">
            <div className="card-icon">🤖</div>
            <h3>AI Learning (Coming Soon)</h3>
            <p>Analyze your content with AI</p>
          </div>

          <div className="action-card coming-soon">
            <div className="card-icon">📚</div>
            <h3>Learning Paths (Coming Soon)</h3>
            <p>Create personalized learning experiences</p>
          </div>
        </div>

        <div className="stats-section">
          <h3>Your ConLearn Journey</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">0</div>
              <div className="stat-label">Files Uploaded</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">0</div>
              <div className="stat-label">AI Analyses</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">1</div>
              <div className="stat-label">Days Active</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
