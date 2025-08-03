import apiClient from './apiClient';

export const getAllUsers = async () => {
  const response = await apiClient.get('/api/users');
  return response.data;
};

export const getUserById = async (userId) => {
  const response = await apiClient.get(`/api/users/${userId}`);
  return response.data;
};