import api from './axios';

export const chatAPI = {
  // Conversations
  getConversations: () => api.get('/chat/conversations'),
  createConversation: (title) => api.post('/chat/conversations', { title }),
  renameConversation: (id, title) => api.patch(`/chat/conversations/${id}`, { title }),
  deleteConversation: (id) => api.delete(`/chat/conversations/${id}`),

  // Messages
  sendMessage: (message, conversationId, model = 'ollama') =>
    api.post('/chat/message', { message, conversationId, model }),
  getHistory: (conversationId, limit) =>
    api.get('/chat/history', { params: { conversationId, limit } }),
};
