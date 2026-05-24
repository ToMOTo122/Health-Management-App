import api from './axios';

export const chatAPI = {
  sendMessage: (message) => api.post('/chat/message', { message }),
  getHistory: (limit) => api.get('/chat/history', { params: { limit } }),
};
