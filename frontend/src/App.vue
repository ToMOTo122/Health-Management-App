<template>
  <!-- keepAlive缓存的路由视图 -->
  <router-view v-slot="{ Component }">
    <keep-alive>
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth.store';

const auth = useAuthStore();

onMounted(async () => {
  if (auth.isAuthenticated) {
    try { await auth.fetchProfile(); } catch (_) {}
  }
});
</script>
