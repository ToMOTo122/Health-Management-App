/* wcw5.25修改-仪表盘测试与优化 */
import api from './axios';

export const analysisAPI = {
  today: () => api.get('/analysis/today'),
  summary: (period) => api.get('/analysis/summary', { params: { period } }),
  trend: (type, period) => api.get(`/analysis/trend/${type}`, { params: { period } }),
  goalStatus: () => api.get('/analysis/goal-status'),
  weeklyReport: () => api.get('/analysis/weekly-report'),
  dashboard: () => api.get('/analysis/dashboard'),
};
