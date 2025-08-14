import React, { createContext, useState, useEffect, useCallback, useRef, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  loginUser, 
  registerUser, 
  getCurrentUser, 
  logoutUser,
  refreshAccessToken 
} from '../api/auth';
import { useToast } from './ToastContext';
import { 
  isTokenExpired, 
  clearAuthData, 
  getUserFromToken,
  isTokenExpiringSoon 
} from '../utils/tokenUtils';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const authCheckComplete = useRef(false);
  const controllerRef = useRef(new AbortController());
  const { error: showError, warning, info } = useToast();
  
  // Token expiration warning system
  const checkTokenExpiration = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    if (isTokenExpiringSoon(token, 10)) { // Warn 10 minutes before expiration
      warning('⏰ Your session will expire soon. Please save any work.', {
        autoHideDuration: 8000,
        position: 'top-center'
      });
    }
  }, [warning]);

  // Helper function to handle token expiration
  const handleTokenExpiration = useCallback(() => {
    clearAuthData();
    setUser(null);
    setError(null);
    authCheckComplete.current = false;
    
    showError('🔒 Your session has expired. Please login again.', {
      autoHideDuration: 5000,
      position: 'top-center'
    });
    
    // Small delay to show the toast before navigation
    setTimeout(() => {
      window.location.href = '/'; // Use window.location for clean redirect
    }, 1000);
  }, [showError]);

  // Enhanced function to handle authentication errors
  const handleAuthError = useCallback((err) => {
    
    if (err.response?.status === 401) {
      const message = err.response?.data?.message || '';
      
      if (message.includes('expired') || message.includes('invalid')) {
        handleTokenExpiration();
        return;
      }
    }
    
    if (err.response?.status === 403) {
      showError('🚫 Access denied. Please check your permissions.', {
        autoHideDuration: 4000,
        position: 'top-center'
      });
      return;
    }
    
    // Handle other authentication errors
    const errorMessage = err.response?.data?.message || err.message || 'Authentication error occurred';
    setError(errorMessage);
  }, [handleTokenExpiration, showError]);

  // Enhanced auth check function with token validation
  const checkAuth = useCallback(async () => {
    if (authCheckComplete.current) return;
    
    try {
      setLoading(true);
      
      // Check if token exists and is valid
      const token = localStorage.getItem('token');
      if (!token || isTokenExpired(token)) {
        // Try to get remembered token
        const rememberedToken = localStorage.getItem('rememberToken');
        if (rememberedToken && !isTokenExpired(rememberedToken)) {
          localStorage.setItem('token', rememberedToken);
          info('🔄 Restoring your session...', { 
            autoHideDuration: 2000,
            position: 'top-center'
          });
        } else {
          // No valid token found, user needs to login
          setUser(null);
          authCheckComplete.current = true;
          setLoading(false);
          return;
        }
      }
      
      const userData = await getCurrentUser({ signal: controllerRef.current.signal });
      setUser(userData);
      setError(null);
    } catch (err) {
      if (err.name !== 'AbortError') {
        handleAuthError(err);
      }
    } finally {
      authCheckComplete.current = true;
      setLoading(false);
    }
  }, [handleAuthError, info]);

  // Initialize auth check and token expiration monitoring
  useEffect(() => {
    if (!authCheckComplete.current) {
      checkAuth();
    }

    // Set up token expiration check interval
    const tokenCheckInterval = setInterval(() => {
      checkTokenExpiration();
    }, 60000); // Check every minute

    return () => {
      controllerRef.current.abort();
      controllerRef.current = new AbortController(); // Reset for next use
      clearInterval(tokenCheckInterval);
    };
  }, [checkAuth, checkTokenExpiration]);

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const response = await loginUser(credentials);
      
      localStorage.setItem('token', response.accessToken);
      setUser(response.user);
      authCheckComplete.current = false; // Reset for next check
      
      return response.user;
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
      setError(null);
      const newUser = await registerUser(userData);
      
      localStorage.setItem('token', newUser.accessToken);
      setUser(newUser.user);
      authCheckComplete.current = false;
      
      return newUser.user;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(async (showMessage = true) => {
    try {
      setLoading(true);
      
      try {
        await logoutUser();
      } catch (err) {
        // Even if logout API fails, we still want to clear local data
        console.warn('Logout API call failed, but continuing with local cleanup:', err);
      }
      
      clearAuthData();
      setUser(null);
      authCheckComplete.current = false;
      setError(null);
      
      if (showMessage) {
        info('👋 You have been logged out successfully.', {
          autoHideDuration: 3000,
          position: 'top-center'
        });
      }
      
      // Redirect to login page
      setTimeout(() => {
        window.location.href = '/';
      }, showMessage ? 1500 : 0);
      
    } catch (err) {
      setError(err.message || 'Logout failed');
      showError('❌ Logout failed. Please try again.', {
        autoHideDuration: 4000,
        position: 'top-center'
      });
    } finally {
      setLoading(false);
    }
  }, [info, showError]);

  const refreshToken = useCallback(async () => {
    try {
      const { accessToken } = await refreshAccessToken();
      localStorage.setItem('token', accessToken);
      return accessToken;
    } catch (err) {
      handleTokenExpiration();
      throw err;
    }
  }, [handleTokenExpiration]);

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    refreshToken,
    checkAuth,
    handleTokenExpiration,
    checkTokenExpiration
  };

  return (
    <AuthContext.Provider value={value}>
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