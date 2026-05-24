import api from './axios';

const TYPES = ['sleep', 'steps', 'water', 'exercise', 'diet', 'stress', 'cycle'];

export const recordsAPI = Object.fromEntries(
  TYPES.map((type) => [
    type,
    {
      create: (data) => api.post(`/health/${type}`, data),
      query: (params) => api.get(`/health/${type}`, { params }),
      getById: (id) => api.get(`/health/${type}/${id}`),
      update: (id, data) => api.put(`/health/${type}/${id}`, data),
      delete: (id) => api.delete(`/health/${type}/${id}`),
    },
  ])
);
