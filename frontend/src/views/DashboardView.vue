<template>
  <AppLayout>
    <div class="page-header">
      <h1>仪表盘</h1>
      <p>{{ todayDate }} · 欢迎回来，{{ auth.user?.nickname || '用户' }}</p>
    </div>

    <div class="stats-grid">
      <div v-for="s in statCards" :key="s.key" :class="['stat-card', s.key]" @click="$router.push('/record')">
        <div class="stat-icon"><i :class="s.icon"></i></div>
        <div class="stat-info">
          <div class="stat-value">{{ s.value }}</div>
          <div class="stat-label">{{ s.label }}</div>
          <div class="stat-sub" v-if="s.sub">{{ s.sub }}</div>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><h3>今日目标完成</h3></div>
        <div v-for="g in goalItems" :key="g.key" class="progress-wrap">
          <div class="progress-label">
            <span><i :class="g.icon"></i> {{ g.label }}</span>
            <span>{{ g.current }} / {{ g.target }} {{ g.unit }}</span>
          </div>
          <div class="progress-bar">
            <div :class="['progress-fill', g.color]" :style="{ width: Math.min(g.percent, 100) + '%' }"></div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3>近期健康总结</h3></div>
        <div v-if="weeklySummary" v-html="weeklySummary"></div>
        <LoadingSpinner v-else />
      </div>
    </div>

    <div class="quick-actions mt-4">
      <button v-for="a in quickActions" :key="a.type" class="quick-btn" @click="$router.push('/record')">
        <i :class="a.icon"></i> {{ a.label }}
      </button>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import LoadingSpinner from '../components/common/LoadingSpinner.vue';
import { useAuthStore } from '../stores/auth.store';
import { useGoalsStore } from '../stores/goals.store';
import { analysisAPI } from '../api/analysis.api';

const router = useRouter();
const auth = useAuthStore();
const goals = useGoalsStore();

const todayStats = ref({ sleep_h: 0, steps: 0, water_ml: 0, exercise_min: 0, calories_kcal: 0 });
const weeklySummary = ref('');

const todayDate = computed(() => {
  return new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
});

const statCards = computed(() => [
  { key: 'sleep', icon: 'fa-solid fa-moon', value: todayStats.value.sleep_h + 'h', label: '睡眠', sub: '今日' },
  { key: 'steps', icon: 'fa-solid fa-shoe-prints', value: todayStats.value.steps.toLocaleString(), label: '步数', sub: '今日' },
  { key: 'water', icon: 'fa-solid fa-droplet', value: todayStats.value.water_ml + 'ml', label: '饮水', sub: '今日' },
  { key: 'exercise', icon: 'fa-solid fa-fire', value: todayStats.value.exercise_min + 'min', label: '运动', sub: '今日' },
  { key: 'diet', icon: 'fa-solid fa-utensils', value: todayStats.value.calories_kcal + 'kcal', label: '热量', sub: '摄入+消耗' },
]);

const goalItems = computed(() => [
  { key: 'sleep', icon: 'fa-solid fa-moon', label: '睡眠', current: todayStats.value.sleep_h, target: goals.goals.sleep_hours || 8, unit: 'h', percent: (todayStats.value.sleep_h / (goals.goals.sleep_hours || 8)) * 100, color: 'purple' },
  { key: 'steps', icon: 'fa-solid fa-shoe-prints', label: '步数', current: todayStats.value.steps, target: goals.goals.steps_daily || 10000, unit: '步', percent: (todayStats.value.steps / (goals.goals.steps_daily || 10000)) * 100, color: 'blue' },
  { key: 'water', icon: 'fa-solid fa-droplet', label: '饮水', current: todayStats.value.water_ml, target: goals.goals.water_ml || 2000, unit: 'ml', percent: (todayStats.value.water_ml / (goals.goals.water_ml || 2000)) * 100, color: 'teal' },
  { key: 'exercise', icon: 'fa-solid fa-fire', label: '运动', current: todayStats.value.exercise_min, target: goals.goals.exercise_min || 30, unit: 'min', percent: (todayStats.value.exercise_min / (goals.goals.exercise_min || 30)) * 100, color: 'orange' },
]);

const quickActions = [
  { type: 'sleep', icon: 'fa-solid fa-moon', label: '记录睡眠' },
  { type: 'steps', icon: 'fa-solid fa-shoe-prints', label: '记录步数' },
  { type: 'water', icon: 'fa-solid fa-droplet', label: '记录饮水' },
  { type: 'exercise', icon: 'fa-solid fa-fire', label: '记录运动' },
  { type: 'diet', icon: 'fa-solid fa-utensils', label: '记录饮食' },
];

onMounted(async () => {
  try {
    const [todayRes, summaryRes] = await Promise.all([
      analysisAPI.today(),
      analysisAPI.weeklyReport(),
    ]);
    if (todayRes.data.success) todayStats.value = todayRes.data.data;
    if (summaryRes.data.success) weeklySummary.value = summaryRes.data.data.text;
  } catch (_) {}
  try { await goals.fetchGoals(); } catch (_) {}
});
</script>
