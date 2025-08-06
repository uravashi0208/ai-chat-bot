import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  loginUser, 
  registerUser, 
  getCurrentUser, 
  logoutUser,
  refreshAccessToken 
} from '../services/authService';
import { useToast } from './ToastContext';
import { 
  isTokenExpired, 
  clearAuthData, 
  getUserFromToken,
  storeToken,
  getStoredToken,
  hasRememberMe
} from '../utils/tokenUtils';

import type { User } from '../types/user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError, info } = useToast();

  // Helper function to handle auth errors
  const handleAuthError = (err: any, defaultMessage: string) => {
    console.error('Auth error:', err);
    
    let errorMessage = defaultMessage;
    
    if (err?.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err?.response?.data?.error) {
      errorMessage = err.response.data.error;
    } else if (err?.message) {
      errorMessage = err.message;
    }
    
    setError(errorMessage);
    showError(errorMessage);
  };

  // Initialize auth state on app start
  const initializeAuth = async () => {
    try {
      setLoading(true);
      
      const token = getStoredToken();
      
      if (!token) {
        console.log('No valid token found');
        setLoading(false);
        return;
      }

      // Check if token is expired
      if (isTokenExpired(token)) {
        console.log('Token expired, attempting refresh...');
        
        const refreshed = await refreshToken();
        if (!refreshed) {
          console.log('Token refresh failed');
          clearAuthData();
          setLoading(false);
          return;
        }
      }

      // Get user data from token
      const userData = getUserFromToken(token);
      if (userData) {
        console.log('User data loaded from token:', userData.username);
        setUser(userData);
        
        // Optionally verify with server
        try {
          const currentUser = await getCurrentUser();
          setUser(currentUser);
          console.log('User data verified with server');
        } catch (err) {
          console.log('Server verification failed, using token data');
          // Keep the token data if server call fails
        }
      }
    } catch (err) {
      console.error('Auth initialization failed:', err);
      clearAuthData();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔐 Attempting login for:', email);

      const response = await loginUser({ email, password });
      
      // Store token
      storeToken(response.token, rememberMe);
      
      // Store refresh token if provided
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      
      // Set user data
      setUser(response.user);
      
      console.log('✅ Login successful for user:', response.user.username);
      success(`Welcome back, ${response.user.username}!`);
      
    } catch (err: any) {
      handleAuthError(err, 'Login failed. Please check your credentials.');
      throw err; // Re-throw to let components handle the error if needed
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (username: string, email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('📝 Attempting registration for:', email);

      const response = await registerUser({ username, email, password });
      
      // Store token
      storeToken(response.token, false); // Don't auto-remember on registration
      
      // Store refresh token if provided
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      
      // Set user data
      setUser(response.user);
      
      console.log('✅ Registration successful for user:', response.user.username);
      success(`Welcome to Chat App, ${response.user.username}!`);
      
    } catch (err: any) {
      handleAuthError(err, 'Registration failed. Please try again.');
      throw err; // Re-throw to let components handle the error if needed
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      
      console.log('👋 Logging out user:', user?.username);
      
      // Call server logout (best effort - don't fail if server is down)
      try {
        await logoutUser();
      } catch (err) {
        console.log('Server logout failed (continuing with local logout)');
      }
      
      // Clear local data
      clearAuthData();
      setUser(null);
      setError(null);
      
      console.log('✅ Logout completed');
      info('You have been logged out');
      
    } catch (err) {
      console.error('Logout error:', err);
      // Even if logout fails, clear local data
      clearAuthData();
      setUser(null);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  // Refresh token function
  const refreshToken = async (): Promise<boolean> => {
    try {
      console.log('🔄 Attempting to refresh token');
      
      const newToken = await refreshAccessToken();
      
      if (newToken) {
        storeToken(newToken, hasRememberMe());
        console.log('✅ Token refreshed successfully');
        return true;
      }
      
      console.log('❌ Token refresh failed');
      return false;
    } catch (err) {
      console.error('Token refresh error:', err);
      return false;
    }
  };

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Set up periodic token refresh
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      const token = getStoredToken();
      if (token && isTokenExpired(token)) {
        console.log('Token expired, attempting refresh...');
        
        const refreshed = await refreshToken();
        if (!refreshed) {
          console.log('Auto-refresh failed, logging out');
          await logout();
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user]);

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};