<template>
  <AppLayout>
    <div class="page-header">
      <h1>数据分析</h1>
      <p>了解你的健康趋势</p>
    </div>

    <div class="tabs">
      <button v-for="p in periods" :key="p.key" :class="['tab', { active: period === p.key }]"
        @click="period = p.key; loadAll()">{{ p.label }}</button>
    </div>

    <div class="stats-grid">
      <div v-for="s in summaryCards" :key="s.key" class="stat-card" :class="s.key">
        <div class="stat-icon"><i :class="s.icon"></i></div>
        <div class="stat-info">
          <div class="stat-value">{{ s.value }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div v-for="c in chartTypes" :key="c.key" class="card">
        <div class="card-header"><h3>{{ c.label }}趋势</h3></div>
        <div class="chart-container">
          <canvas :ref="el => chartRefs[c.key] = el"></canvas>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import AppLayout from '../components/layout/AppLayout.vue';
import { analysisAPI } from '../api/analysis.api';
import { useCharts } from '../composables/useCharts';
import Chart from 'chart.js/auto';

const { createChart, destroyAll } = useCharts();

const period = ref('week');
const summary = ref({ avg_sleep: 0, avg_steps: 0, avg_water: 0, total_exercise_min: 0 });
const chartRefs = {};

const periods = [
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: '3month', label: '近三月' },
];

const chartTypes = [
  { key: 'sleep', label: '睡眠 (小时)' },
  { key: 'steps', label: '步数' },
  { key: 'water', label: '饮水 (ml)' },
  { key: 'exercise', label: '运动 (分钟)' },
];

const summaryCards = computed(() => [
  { key: 'sleep', icon: 'fa-solid fa-moon', value: summary.value.avg_sleep + 'h', label: '日均睡眠' },
  { key: 'steps', icon: 'fa-solid fa-shoe-prints', value: Math.round(summary.value.avg_steps).toLocaleString(), label: '日均步数' },
  { key: 'water', icon: 'fa-solid fa-droplet', value: Math.round(summary.value.avg_water) + 'ml', label: '日均饮水' },
  { key: 'exercise', icon: 'fa-solid fa-fire', value: summary.value.total_exercise_min + 'min', label: '总运动时长' },
]);

async function loadSummary() {
  try {
    const { data } = await analysisAPI.summary(period.value);
    if (data.success) summary.value = data.data;
  } catch (_) {}
}

async function loadChart(key) {
  try {
    const { data } = await analysisAPI.trend(key, period.value);
    if (!data.success || !chartRefs[key]) return;
    await nextTick();
    const el = chartRefs[key];
    if (!el) return;
    // Destroy existing chart on this canvas
    const existing = Chart.getChart(el);
    if (existing) existing.destroy();
    createChart(el, {
      type: 'line',
      data: {
        labels: data.data.labels.map((d) => d.slice(5)),
        datasets: [{ label: key, data: data.data.values, borderColor: '#42A5F5', backgroundColor: 'rgba(66,165,245,0.1)', fill: true, tension: 0.4 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });
  } catch (_) {}
}

async function loadAll() {
  await loadSummary();
  await nextTick();
  for (const c of chartTypes) {
    await loadChart(c.key);
  }
}

watch(period, loadAll);

onMounted(loadAll);
onUnmounted(destroyAll);
</script>
