import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authAPI } from '../api/auth.api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const token = ref(localStorage.getItem('accessToken'));
  const refreshToken = ref(localStorage.getItem('refreshToken'));

  const isAuthenticated = computed(() => !!token.value);

  async function login(email, password) {
    const { data } = await authAPI.login({ email, password });
    if (data.success) {
      token.value = data.data.token;
      refreshToken.value = data.data.refreshToken;
      user.value = data.data.user;
      localStorage.setItem('accessToken', data.data.token);
      localStorage.setItem('refreshToken', data.data.refreshToken);
    }
    return data;
  }

  async function register(nickname, email, password) {
    const { data } = await authAPI.register({ nickname, email, password });
    if (data.success) {
      token.value = data.data.token;
      refreshToken.value = data.data.refreshToken;
      user.value = data.data.user;
      localStorage.setItem('accessToken', data.data.token);
      localStorage.setItem('refreshToken', data.data.refreshToken);
    }
    return data;
  }

  async function fetchProfile() {
    const { data } = await authAPI.me();
    if (data.success) {
      user.value = { id: data.data.id, email: data.data.email, nickname: data.data.nickname, ...data.data };
    }
    return data;
  }

  async function logout() {
    try {
      await authAPI.logout();
    } catch (_) {}
    token.value = null;
    refreshToken.value = null;
    user.value = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  return { user, token, refreshToken, isAuthenticated, login, register, fetchProfile, logout };
});
