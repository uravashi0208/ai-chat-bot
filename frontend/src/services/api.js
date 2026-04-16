import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wa_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('wa_token');
      localStorage.removeItem('wa_user');
      window.location.href = '/login';
    }
    return Promise.reject(err.response?.data || err);
  },
);

// Auth
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// Users
export const usersApi = {
  search: (q) => api.get(`/users/search?q=${encodeURIComponent(q)}`),
  getContacts: () => api.get('/users/contacts'),
  addContact: (contactId, nickname) => api.post(`/users/contacts/${contactId}`, { nickname }),
  getById: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
};

// Conversations
export const conversationsApi = {
  getAll: () => api.get('/conversations'),
  getById: (id) => api.get(`/conversations/${id}`),
  findOrCreateDirect: (targetUserId) => api.post(`/conversations/direct/${targetUserId}`),
  createGroup: (data) => api.post('/conversations/group', data),
  markAsRead: (id) => api.put(`/conversations/${id}/read`),
};

// Messages
export const messagesApi = {
  getMessages: (conversationId, limit, before) =>
    api.get(`/conversations/${conversationId}/messages`, { params: { limit, before } }),
  send: (conversationId, data) => api.post(`/conversations/${conversationId}/messages`, data),
  edit: (conversationId, messageId, content) =>
    api.put(`/conversations/${conversationId}/messages/${messageId}`, { content }),
  delete: (conversationId, messageId) =>
    api.delete(`/conversations/${conversationId}/messages/${messageId}`),
  addReaction: (conversationId, messageId, emoji) =>
    api.post(`/conversations/${conversationId}/messages/${messageId}/reactions`, { emoji }),
  removeReaction: (conversationId, messageId, emoji) =>
    api.delete(`/conversations/${conversationId}/messages/${messageId}/reactions/${emoji}`),
};

export default api;
