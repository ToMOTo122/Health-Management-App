<template>
  <router-view />
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
