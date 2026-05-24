<template>
  <div class="bottom-nav">
    <div class="bottom-nav-inner">
      <router-link v-for="item in items" :key="item.route" :to="item.path"
        :class="['bottom-nav-item', { active: currentRoute === item.route }]">
        <i :class="item.icon"></i>
        <span>{{ item.label }}</span>
      </router-link>
    </div>
  </div>
</template>

<script setup>
defineProps({ currentRoute: String });

const items = [
  { route: 'dashboard', path: '/', icon: 'fa-solid fa-house', label: '首页' },
  { route: 'record', path: '/record', icon: 'fa-solid fa-plus-circle', label: '记录' },
  { route: 'analysis', path: '/analysis', icon: 'fa-solid fa-chart-line', label: '分析' },
  { route: 'chat', path: '/chat', icon: 'fa-solid fa-robot', label: 'AI' },
  { route: 'profile', path: '/profile', icon: 'fa-solid fa-user', label: '我的' },
];
</script>
