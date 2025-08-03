import apiClient from './apiClient';

export const registerUser = async (userData) => {
   const response = await apiClient.post(`/api/auth/register`, userData);
  // const response = await axios.post(`${API_URL}/api/auth/register`, userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await apiClient.post(`/api/auth/login`, credentials);
  // const response = await axios.post(`${API_URL}/api/auth/login`, credentials, {
  //   withCredentials: true
  // });
  return response.data;
};

export const logoutUser = async () => {
  try {
    const response = await apiClient.post('/api/auth/logout', {}, {
      withCredentials: true  // This is crucial for cookie-based auth
    });
    return response.data;
  } catch (error) {
    console.error('Logout error:', error);
    throw error.response?.data || { error: 'Logout failed' };
  }
};

export const getCurrentUser = async () => {
  const response = await apiClient.get(`/api/users/me`);
  // const response = await axios.get(`${API_URL}/api/users/me`, {
  //   withCredentials: true
  // });
  return response.data;
};

export const refreshAccessToken = async () => {
  const response = await apiClient.post(`/api/auth/refresh-token`,{});
  // const response = await axios.post(`${API_URL}/api/auth/refresh-token`, {}, {
  //   withCredentials: true
  // });
  return response.data;
};