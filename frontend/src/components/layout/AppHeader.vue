<template>
  <div class="mobile-header">
    <button class="hamburger" @click="$emit('toggle')"><i class="fa-solid fa-bars"></i></button>
    <h2>{{ title }}</h2>
    <div style="width:24px"></div>
  </div>
</template>

<script setup>
defineProps({ title: String });
defineEmits(['toggle']);
</script>
