import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header>
      <nav>
        <div className="container">
          <Link to="/">Home</Link>
          {user ? (
            <>
              <Link to="/chat">Chat</Link>
              <button onClick={logout}>Logout</button>
              <span>Welcome, {user.username}</span>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;