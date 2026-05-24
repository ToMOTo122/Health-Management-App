import api from './axios';

export const analysisAPI = {
  today: () => api.get('/analysis/today'),
  summary: (period) => api.get('/analysis/summary', { params: { period } }),
  trend: (type, period) => api.get(`/analysis/trend/${type}`, { params: { period } }),
  goalStatus: () => api.get('/analysis/goal-status'),
  weeklyReport: () => api.get('/analysis/weekly-report'),
};
