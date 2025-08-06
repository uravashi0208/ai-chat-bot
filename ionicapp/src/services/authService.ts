import axios, { AxiosResponse } from 'axios';
import type { User, AuthResponse, LoginRequest, RegisterRequest } from '../types/user';

const API_URL = import.meta.env?.VITE_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);



// Auth API functions
export const loginUser = async ({ email, password, signal }: LoginRequest): Promise<AuthResponse> => {
  try {
    console.log('🔐 Attempting login for email:', email);
    
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/login', {
      email,
      password
    }, {
      signal
    });

    console.log('✅ Login successful for user:', response.data.user.username);
    return response.data;
  } catch (error: any) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
};

export const registerUser = async ({ username, email, password, signal }: RegisterRequest): Promise<AuthResponse> => {
  try {
    console.log('📝 Attempting registration for email:', email);
    
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/register', {
      username,
      email,
      password
    }, {
      signal
    });

    console.log('✅ Registration successful for user:', response.data.user.username);
    return response.data;
  } catch (error: any) {
    console.error('❌ Registration failed:', error.response?.data || error.message);
    throw error;
  }
};

export const getCurrentUser = async (): Promise<User> => {
  try {
    console.log('👤 Fetching current user data');
    
    const response: AxiosResponse<User> = await api.get('/auth/me');
    
    console.log('✅ Current user data retrieved:', response.data.username);
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to fetch current user:', error.response?.data || error.message);
    throw error;
  }
};

export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    console.log('🔄 Attempting to refresh access token');
    
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      console.log('❌ No refresh token available');
      return null;
    }

    const response: AxiosResponse<{ token: string }> = await api.post('/auth/refresh', {
      refreshToken
    });

    console.log('✅ Token refreshed successfully');
    return response.data.token;
  } catch (error: any) {
    console.error('❌ Token refresh failed:', error.response?.data || error.message);
    localStorage.removeItem('refreshToken');
    return null;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    console.log('👋 Attempting logout');
    
    await api.post('/auth/logout');
    
    console.log('✅ Logout successful');
  } catch (error: any) {
    console.error('❌ Logout failed:', error.response?.data || error.message);
    // Don't throw error for logout - continue with local cleanup
  }
};

export const forgotPassword = async (email: string): Promise<void> => {
  try {
    console.log('🔑 Requesting password reset for email:', email);
    
    await api.post('/auth/forgot-password', { email });
    
    console.log('✅ Password reset email sent');
  } catch (error: any) {
    console.error('❌ Password reset request failed:', error.response?.data || error.message);
    throw error;
  }
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  try {
    console.log('🔒 Attempting password reset');
    
    await api.post('/auth/reset-password', {
      token,
      newPassword
    });
    
    console.log('✅ Password reset successful');
  } catch (error: any) {
    console.error('❌ Password reset failed:', error.response?.data || error.message);
    throw error;
  }
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  try {
    console.log('🔐 Attempting password change');
    
    await api.put('/auth/change-password', {
      currentPassword,
      newPassword
    });
    
    console.log('✅ Password changed successfully');
  } catch (error: any) {
    console.error('❌ Password change failed:', error.response?.data || error.message);
    throw error;
  }
};

// Export the configured axios instance for other services to use
export { api };