import apiClient from './apiClient';


export const getMessages = async (userId) => {
  const response = await apiClient.get(`/api/chat/messages/${userId}`);
  // const response = await axios.get(`${API_URL}/api/chat/messages/${userId}`, {
  //   withCredentials: true
  // });
  return response.data;
};

export const sendMessage = async (messageData) => {
  const response = await apiClient.post(`/api/chat/messages/${messageData.receiverId}`, {content: messageData.content});
  // const response = await axios.post(`${API_URL}/api/chat/messages/${messageData.receiverId}`, {
  //   content: messageData.content
  // }, {
  //   withCredentials: true
  // });
  return response.data;
};

export const markMessageAsRead = async (messageId) => {
  const response = await apiClient.patch(`/api/chat/messages/${messageId}/read`, {});
  // const response = await axios.patch(`${API_URL}/api/chat/messages/${messageId}/read`, {}, {
  //   withCredentials: true
  // });
  return response.data;
};

export const markMessagesAsRead = async (messageIds) => {
  const response = await apiClient.patch('/api/chat/messages/read', { messageIds });
  return response.data;
};

export const getUsers = async () => {
  const response = await apiClient.get('/api/users');
  // const response = await axios.get(`${API_URL}/api/users`, {
  //   withCredentials: true
  // });
  return response.data;
};