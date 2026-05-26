<template>
  <div class="app-layout">
    <AppSidebar :sidebarOpen="sidebarOpen" :route="currentRoute" @navigate="sidebarOpen = false" />
    <div class="sidebar-overlay" :class="{ open: sidebarOpen }" @click="sidebarOpen = false"></div>
    <AppHeader :title="pageTitle" @toggle="sidebarOpen = !sidebarOpen" />
    <div class="main-content">
      <slot />
    </div>
    <BottomNav :currentRoute="currentRoute" />
    <Toast />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import AppSidebar from './AppSidebar.vue';
import AppHeader from './AppHeader.vue';
import BottomNav from './BottomNav.vue';
import Toast from '../common/Toast.vue';

const route = useRoute();
const sidebarOpen = ref(false);

const pageTitleMap = {
  Dashboard: '仪表盘', Record: '健康记录', Analysis: '数据分析',
  Chat: 'AI 助手', Profile: '个人中心',
};

const currentRoute = computed(() => {
  const name = route.name;
  return name ? String(name).toLowerCase() : 'dashboard';
});

const pageTitle = computed(() => {
  const name = route.name;
  return name ? (pageTitleMap[name] || name) : '健康小助手';
});
</script>
