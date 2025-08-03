import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { 
  loginUser, 
  registerUser, 
  getCurrentUser, 
  logoutUser,
  refreshAccessToken
} from '../api/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAuth = useCallback(async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials) => {
    try {
      setLoading(true);
       const response = await loginUser(credentials);
        localStorage.setItem('token', response.accessToken);
      // const { user, accessToken } = await loginUser(credentials);
      // localStorage.setItem('token', accessToken); // Store token
      setUser(response.user);
      setError(null);
      return user;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const newUser = await registerUser(userData);
      setUser(newUser);
      setError(null);
      return newUser;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      localStorage.removeItem('token'); 
      setUser(null);
      setError(null);
    } catch (err) {
      setError(err.message || 'Logout failed');
    }
  };

  const refreshToken = async () => {
    try {
      const { accessToken } = await refreshAccessToken();
      return accessToken;
    } catch (err) {
      logout();
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        refreshToken,
        checkAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};