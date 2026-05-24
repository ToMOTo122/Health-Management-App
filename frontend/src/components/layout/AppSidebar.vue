<template>
  <div :class="['sidebar', { open: sidebarOpen }]">
    <div class="sidebar-header">
      <div class="logo-icon">💙</div>
      <h2>健康小助手</h2>
      <div class="subtitle">一站式健康管理</div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section">主菜单</div>
      <router-link to="/" class="nav-item" :class="{ active: route === 'dashboard' }" @click="$emit('navigate')">
        <i class="fa-solid fa-house"></i> 仪表盘
      </router-link>
      <router-link to="/record" class="nav-item" :class="{ active: route === 'record' }" @click="$emit('navigate')">
        <i class="fa-solid fa-plus-circle"></i> 健康记录
      </router-link>
      <router-link to="/analysis" class="nav-item" :class="{ active: route === 'analysis' }" @click="$emit('navigate')">
        <i class="fa-solid fa-chart-line"></i> 数据分析
      </router-link>
      <router-link to="/chat" class="nav-item" :class="{ active: route === 'chat' }" @click="$emit('navigate')">
        <i class="fa-solid fa-robot"></i> AI 助手
      </router-link>
      <div class="nav-section">账户</div>
      <router-link to="/profile" class="nav-item" :class="{ active: route === 'profile' }" @click="$emit('navigate')">
        <i class="fa-solid fa-user-gear"></i> 个人中心
      </router-link>
    </nav>
    <div class="sidebar-footer">
      <div class="user-mini" @click="$router.push('/profile')">
        <div class="user-avatar">{{ initial }}</div>
        <div class="info">
          <div class="name">{{ user?.nickname || '用户' }}</div>
          <div class="role">健康管理者</div>
        </div>
        <i class="fa-solid fa-ellipsis-vertical" style="opacity:0.5"></i>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../../stores/auth.store';

defineProps({ sidebarOpen: Boolean, route: String });
defineEmits(['navigate']);

const auth = useAuthStore();
const user = computed(() => auth.user);
const initial = computed(() => (user.value?.nickname || '用')[0]);
</script>
