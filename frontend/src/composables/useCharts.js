import { ref, onUnmounted } from 'vue';
import Chart from 'chart.js/auto';

export function useCharts() {
  const chartInstances = ref([]);

  function createChart(ctx, config) {
    const chart = new Chart(ctx, config);
    chartInstances.value.push(chart);
    return chart;
  }

  function destroyAll() {
    for (const chart of chartInstances.value) {
      chart.destroy();
    }
    chartInstances.value = [];
  }

  onUnmounted(destroyAll);

  return { createChart, destroyAll };
}
