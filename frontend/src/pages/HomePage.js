import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import '../assets/styles/chat.css'; 

const HomePage = () => {
  const { user } = useAuth();

  return (
    <div className="home-page">
      <h1>Welcome to Real-Time Chat</h1>
      {user ? (
        <Link to="/chat" className="btn-primary">
          Go to Chat
        </Link>
      ) : (
        <div className="auth-links">
          <Link to="/login" className="btn-primary">
            Login
          </Link>
          <Link to="/register" className="btn-primary">
            Register
          </Link>
        </div>
      )}
    </div>
  );
};

export default HomePage;