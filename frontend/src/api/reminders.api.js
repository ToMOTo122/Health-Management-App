import api from './axios';

export const remindersAPI = {
  list: () => api.get('/reminders'),
  create: (data) => api.post('/reminders', data),
  update: (id, data) => api.put(`/reminders/${id}`, data),
  delete: (id) => api.delete(`/reminders/${id}`),
  due: () => api.get('/reminders/due'),
};
