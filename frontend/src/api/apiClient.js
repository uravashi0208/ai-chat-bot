// src/api/apiClient.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000 // Add timeout to prevent hanging requests
});

let isRefreshing = false;
let refreshSubscribers = [];

const onRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const onRefreshDone = () => {
  refreshSubscribers.forEach(callback => callback());
  refreshSubscribers = [];
};

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Enhanced response interceptor with better error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized errors (token expired/invalid)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      if (!isRefreshing) {
        isRefreshing = true;
        
        try {
          const refreshTokenResponse = await axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/refresh-token`, 
            {},
            { withCredentials: true }
          );
          
          const newToken = refreshTokenResponse.data.accessToken;
          localStorage.setItem('token', newToken);
          
          // Update Authorization header for future requests
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          
          onRefreshDone();
          isRefreshing = false;
          
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Clear tokens and redirect
          localStorage.removeItem('token');
          localStorage.removeItem('rememberToken');
          isRefreshing = false;
          
          // Use a more specific error message
          const errorMessage = refreshError.response?.data?.message || 'Session expired';
          
          // Create a custom error for the auth context to handle
          const customError = new Error(errorMessage);
          customError.response = {
            status: 401,
            data: { message: 'Token expired or invalid' }
          };
          
          // Don't redirect here, let AuthContext handle it with proper toast
          return Promise.reject(customError);
        }
      }

      // If already refreshing, queue the request
      return new Promise((resolve, reject) => {
        const retryRequest = () => {
          apiClient(originalRequest)
            .then(resolve)
            .catch(reject);
        };
        onRefresh(retryRequest);
      });
    }

    // Handle network errors
    if (!error.response) {
      const networkError = new Error('Network connection failed. Please check your internet connection.');
      networkError.isNetworkError = true;
      return Promise.reject(networkError);
    }

    // Handle server errors (5xx)
    if (error.response?.status >= 500) {
      const serverError = new Error('Server is temporarily unavailable. Please try again later.');
      serverError.isServerError = true;
      return Promise.reject(serverError);
    }

    return Promise.reject(error);
  }
);

export default apiClient;