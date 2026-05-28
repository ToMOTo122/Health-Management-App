import { ref, onUnmounted, nextTick } from 'vue';
import Chart from 'chart.js/auto';

/* 统一图表管理工具
 * 职责：
 * 1. 创建图表前自动销毁同一canvas上的旧实例
 * 2. 确保canvas挂载后才创建(配合nextTick)
 * 3. 组件卸载时自动销毁
 * 4. 支持按canvas名称销毁单个图表
 */
export function useCharts() {
  const chartInstances = ref({}); // 改为对象，按canvas ID索引

  // 自动销毁同一canvas上的旧实例
  function destroyExisting(ctx) {
    if (!ctx) return;
    const existing = Chart.getChart(ctx);
    if (existing) {
      existing.destroy();
    }
    // 同时从instances中移除
    if (chartInstances.value[ctx.id]) {
      delete chartInstances.value[ctx.id];
    }
  }

  // 创建图表（确保时机正确）
  async function createChart(ctx, config) {
    await nextTick();

    if (!ctx) {
      console.warn('[useCharts] canvas element not found');
      return null;
    }

    // 先销毁旧实例
    destroyExisting(ctx);

    const chart = new Chart(ctx, config);
    chartInstances.value[ctx.id] = chart;
    return chart;
  }

  // 同步创建（调用方保证canvas已挂载）
  function createChartSync(ctx, config) {
    if (!ctx) {
      console.warn('[useCharts] canvas element not found');
      return null;
    }

    // 先销毁旧实例
    destroyExisting(ctx);

    const chart = new Chart(ctx, config);
    chartInstances.value[ctx.id] = chart;
    return chart;
  }

  // 销毁指定canvas的图表
  function destroyChart(ctxOrId) {
    const id = typeof ctxOrId === 'string' ? ctxOrId : ctxOrId?.id;
    if (!id) return;

    const chart = chartInstances.value[id];
    if (chart) {
      chart.destroy();
      delete chartInstances.value[id];
    } else {
      // 也尝试通过Chart.getChart查找
      const canvas = document.getElementById(id);
      if (canvas) {
        const existing = Chart.getChart(canvas);
        if (existing) existing.destroy();
      }
    }
  }

  // 销毁所有图表
  function destroyAll() {
    Object.values(chartInstances.value).forEach(chart => {
      if (chart) chart.destroy();
    });
    chartInstances.value = {};
  }

  // 组件卸载时自动销毁
  onUnmounted(destroyAll);

  return {
    createChart,
    createChartSync,
    destroyChart,
    destroyAll,
    chartInstances,
  };
}