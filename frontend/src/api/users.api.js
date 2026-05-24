import api from './axios';

export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/password', data),
  getGoals: () => api.get('/users/goals'),
  updateGoals: (data) => api.put('/users/goals', data),
};
