import api from './axios';

export const exportAPI = {
  json: () => api.get('/export/json', { responseType: 'blob' }),
  csv: (type) => api.get(`/export/csv/${type}`, { responseType: 'blob' }),
};
