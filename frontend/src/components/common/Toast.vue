<template>
  <div class="toast-container">
    <div v-for="t in toasts" :key="t.id" :class="['toast', t.type]">
      <i :class="iconMap[t.type] || 'fa-info-circle'"></i> {{ t.message }}
    </div>
  </div>
</template>

<script setup>
import { useToast } from '../../composables/useToast';

const { toasts } = useToast();

const iconMap = { success: 'fa-solid fa-check-circle', error: 'fa-solid fa-exclamation-circle', info: 'fa-solid fa-info-circle' };
</script>
