import { ref, onMounted, onUnmounted } from 'vue';

export function useResponsive() {
  const isMobile = ref(window.innerWidth <= 900);

  function onResize() {
    isMobile.value = window.innerWidth <= 900;
  }

  onMounted(() => window.addEventListener('resize', onResize));
  onUnmounted(() => window.removeEventListener('resize', onResize));

  return { isMobile };
}
