<!-- wcw5.25修改-仪表盘测试与优化 -->
<template>
  <AppLayout>
    <!-- 1. 顶部概览横幅 + 环形进度 -->
    <div class="hero">
      <div class="hero-text">
        <div class="greet">你好，{{ auth.user?.nickname || '用户' }}</div>
        <div class="date"><i class="far fa-calendar-check" style="margin-right:6px"></i>{{ todayDate }}</div>
        <div class="tagline">{{ heroTagline }}</div>
      </div>
      <div class="hero-ring">
        <div class="ring-wrap">
          <svg width="108" height="108" viewBox="0 0 108 108">
            <circle cx="54" cy="54" r="47" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="9"/>
            <circle cx="54" cy="54" r="47" fill="none" stroke="#fff" stroke-width="9"
              stroke-linecap="round"
              :stroke-dasharray="295.3"
              :stroke-dashoffset="295.3 - 295.3 * dailyScore / 100"
              style="transition: stroke-dashoffset 0.8s ease"/>
          </svg>
          <div class="ring-center">
            <div class="pct">{{ dailyScore }}<small>%</small></div>
            <div class="cap">今日完成度</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. 数据型统计卡：值 + 环比趋势 + 7天 sparkline -->
    <div class="metric-grid">
      <div v-for="m in dashboardMetrics" :key="m.key" class="metric-card" @click="quickRecord(m.key)">
        <div class="metric-top">
          <div class="metric-icon" :class="m.key"><i :class="m.icon"></i></div>
          <div class="metric-trend" :class="m.trendDir">
            <i :class="m.trendDir === 'up' ? 'fas fa-arrow-trend-up' : m.trendDir === 'down' ? 'fas fa-arrow-trend-down' : 'fas fa-minus'"></i>
            {{ m.trendText }}
          </div>
        </div>
        <div class="metric-value">{{ m.display }}<small> {{ m.unit }}</small></div>
        <div class="metric-label">{{ m.label }} · 较昨日</div>
        <div class="spark" :class="m.key">
          <span v-for="(v, i) in m.spark" :key="i"
            :class="{ today: i === m.spark.length - 1 }"
            :style="{ height: (m.sparkMax ? Math.max(8, v / m.sparkMax * 100) : 8) + '%' }"></span>
        </div>
      </div>
    </div>

    <!-- 3. 近7天活动趋势图 + 快速记录 -->
    <div class="grid-2 mb-4">
      <div class="card">
        <div class="card-header">
          <div class="section-title"><span class="st-dot"><i class="fas fa-chart-line"></i></span>近7天活动趋势</div>
          <span class="badge badge-blue">睡眠 / 步数</span>
        </div>
        <div class="chart-container" style="height: 240px"><canvas id="dashTrend"></canvas></div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="section-title"><span class="st-dot"><i class="fas fa-bolt"></i></span>快速记录</div>
        </div>
        <div class="quick-actions">
          <button class="quick-btn" @click="quickRecord('sleep')"><i class="fas fa-moon"></i> 睡眠</button>
          <button class="quick-btn" @click="quickRecord('steps')"><i class="fas fa-shoe-prints"></i> 步数</button>
          <button class="quick-btn" @click="quickRecord('water')"><i class="fas fa-droplet"></i> 饮水</button>
          <button class="quick-btn" @click="quickRecord('exercise')"><i class="fas fa-dumbbell"></i> 运动</button>
          <button class="quick-btn" @click="quickRecord('diet')"><i class="fas fa-utensils"></i> 饮食</button>
          <button class="quick-btn" @click="quickRecord('stress')"><i class="fas fa-brain"></i> 压力</button>
        </div>
        <div style="margin-top: 18px;">
          <h4 style="font-size:13px; color: var(--text-secondary); margin-bottom: 10px; display:flex; align-items:center; gap:6px;">
            <i class="far fa-clock"></i> 今日记录
          </h4>
          <div v-if="!todayHasData" style="color: var(--text-secondary); font-size: 13px; padding: 12px 0;">
            今天还没有记录，点击上方按钮快速添加
          </div>
          <div v-else style="color: var(--text-secondary); font-size: 13px; padding: 12px 0;">
            已有 {{ todayRecordCount }} 条记录
          </div>
        </div>
      </div>
    </div>

    <!-- 4. 本周健康报告：评分 + 结构化指标 -->
    <div class="card">
      <div class="card-header">
        <div class="section-title"><span class="st-dot"><i class="fas fa-clipboard-check"></i></span>本周健康报告</div>
        <span class="badge badge-green">近 7 天</span>
      </div>
      <div class="insight-layout">
        <div class="score-box">
          <div class="score-num">{{ weekReport.score }}<small>分</small></div>
          <div class="score-cap">综合健康评分</div>
          <div class="score-tag">{{ weekReport.grade }}</div>
        </div>
        <div>
          <div class="insight-rows">
            <div v-for="row in weekReport.breakdown" :key="row.name" class="insight-row">
              <div class="ir-icon" :style="{ background: getGrad(row.name) }"><i :class="getIcon(row.name)"></i></div>
              <div class="ir-name">{{ row.name }}</div>
              <div class="ir-bar"><div class="ir-fill" :style="{ width: row.pct + '%', background: getGrad(row.name) }"></div></div>
              <div class="ir-val">{{ row.value }} / {{ row.target }} {{ row.unit }}</div>
            </div>
          </div>
          <div class="insight-note">
            <i class="fas fa-lightbulb"></i>
            <span>{{ weekReport.advice }}</span>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, onActivated, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import LoadingSpinner from '../components/common/LoadingSpinner.vue';
import { useAuthStore } from '../stores/auth.store';
import { useGoalsStore } from '../stores/goals.store';
import { analysisAPI } from '../api/analysis.api';
import { useCharts } from '../composables/useCharts';

// wcw5.25修改-使用统一图表工具
const { createChartSync, destroyAll: destroyAllCharts } = useCharts();

const router = useRouter();
const auth = useAuthStore();
const goals = useGoalsStore();

const dashboardData = ref(null);
const loading = ref(true);

const todayDate = computed(() => {
  return new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
});

const todayStr = computed(() => new Date().toISOString().split('T')[0]);

const todayHasData = computed(() => {
  if (!dashboardData.value?.today) return false;
  const t = dashboardData.value.today;
  return t.sleep_h > 0 || t.steps > 0 || t.water_ml > 0 || t.exercise_min > 0;
});

const todayRecordCount = computed(() => {
  if (!dashboardData.value?.today) return 0;
  const t = dashboardData.value.today;
  let count = 0;
  if (t.sleep_h > 0) count++;
  if (t.steps > 0) count++;
  if (t.water_ml > 0) count++;
  if (t.exercise_min > 0) count++;
  return count;
});

// 今日完成度
const dailyScore = computed(() => {
  if (!dashboardData.value?.today) return 0;
  const g = goals.goals;
  const s = dashboardData.value.today;
  const parts = [
    s.sleep_h / (g.sleep_hours || 8),
    s.steps / (g.steps_daily || 10000),
    s.water_ml / (g.water_ml || 2000),
    s.exercise_min / (g.exercise_min || 30),
  ];
  const avg = parts.reduce((a, b) => a + Math.min(1, b), 0) / parts.length;
  return Math.round(avg * 100);
});

// Hero 文案
const heroTagline = computed(() => {
  const sc = dailyScore.value;
  if (sc >= 80) return '今天的状态很棒，各项指标接近目标，继续保持这份节奏。';
  if (sc >= 50) return '今天完成了一半以上的目标，再补几项就能圆满收尾。';
  if (sc >= 20) return '今天才刚开始，记录下你的睡眠和运动，让数据陪你变好。';
  return '还没有今日数据，点击下方快速记录，开启今天的健康追踪。';
});

// 四张数据卡
const dashboardMetrics = computed(() => {
  if (!dashboardData.value) return [];

  const defs = [
    { key: 'sleep', icon: 'fas fa-moon', label: '睡眠', unit: 'h', field: 'sleep_h' },
    { key: 'steps', icon: 'fas fa-shoe-prints', label: '步数', unit: '步', field: 'steps' },
    { key: 'water', icon: 'fas fa-droplet', label: '饮水', unit: 'ml', field: 'water_ml' },
    { key: 'diet', icon: 'fas fa-utensils', label: '热量', unit: 'kcal', field: 'calories_kcal' },
  ];

  const today = dashboardData.value.today || {};
  const yesterday = dashboardData.value.yesterday || {};
  const series = dashboardData.value.series || { sleep: [], steps: [], water: [] };

  return defs.map(d => {
    let val = 0;
    if (d.key === 'sleep') val = today.sleep_h || 0;
    else if (d.key === 'steps') val = today.steps || 0;
    else if (d.key === 'water') val = today.water_ml || 0;
    else if (d.key === 'diet') val = today.calories_kcal || 0;

    let yestVal = 0;
    if (d.key === 'sleep') yestVal = yesterday.sleep_h || 0;
    else if (d.key === 'steps') yestVal = yesterday.steps || 0;
    else if (d.key === 'water') yestVal = yesterday.water_ml || 0;

    let spark = [];
    if (d.key === 'sleep') spark = series.sleep || [];
    else if (d.key === 'steps') spark = series.steps || [];
    else if (d.key === 'water') spark = series.water || [];
    else spark = Array(7).fill(0);

    const sparkMax = Math.max(...spark, 1);

    let trendDir = 'flat', trendText = '持平';
    if (yestVal > 0) {
      const diff = (val - yestVal) / yestVal * 100;
      if (diff >= 3) { trendDir = 'up'; trendText = '+' + Math.round(diff) + '%'; }
      else if (diff <= -3) { trendDir = 'down'; trendText = Math.round(diff) + '%'; }
    } else if (val > 0) {
      trendDir = 'up'; trendText = '新增';
    }

    let display = val;
    if (d.key === 'sleep') display = val.toFixed(1);
    else if (d.key === 'steps') display = val.toLocaleString();
    else if (d.key === 'water') display = Math.round(val);
    else display = Math.round(val);

    return {
      key: d.key, icon: d.icon, label: d.label, unit: d.unit,
      display, spark, sparkMax, trendDir, trendText
    };
  });
});

// 本周健康报告
const weekReport = computed(() => {
  if (!dashboardData.value?.week) {
    return { score: 0, grade: '需努力', advice: '暂无数据', breakdown: [] };
  }
  const w = dashboardData.value.week;
  return w;
});

// 辅助函数
function getGrad(name) {
  const map = { '睡眠': 'var(--grad-sleep)', '步数': 'var(--grad-steps)', '饮水': 'var(--grad-water)', '运动': 'var(--grad-diet)' };
  return map[name] || 'var(--grad-primary)';
}

function getIcon(name) {
  const map = { '睡眠': 'fas fa-moon', '步数': 'fas fa-shoe-prints', '饮水': 'fas fa-droplet', '运动': 'fas fa-dumbbell' };
  return map[name] || 'fas fa-chart-line';
}

function quickRecord(type) {
  router.push({ path: '/record', query: { tab: type } });
}

// 渲染趋势图 - wcw5.25修改-使用统一图表工具
function renderDashChart() {
  const canvas = document.getElementById('dashTrend');
  if (!canvas) {
    setTimeout(renderDashChart, 100);
    return;
  }

  if (!dashboardData.value?.series) return;
  const { sleep, steps } = dashboardData.value.series;
  const labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  const sleepArr = sleep?.slice(-7) || Array(7).fill(0);
  const stepsArr = steps?.slice(-7) || Array(7).fill(0);

  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 240);
  grad.addColorStop(0, 'rgba(156,123,224,0.55)');
  grad.addColorStop(1, 'rgba(156,123,224,0.10)');

  // 使用统一工具创建图表，会自动销毁旧实例
  createChartSync(canvas, {
    data: {
      labels,
      datasets: [
        { type: 'bar', label: '睡眠 (h)', data: sleepArr, yAxisID: 'y',
          backgroundColor: grad, borderRadius: 6, barPercentage: 0.55, order: 2 },
        { type: 'line', label: '步数', data: stepsArr, yAxisID: 'y1',
          borderColor: '#5B9DF0', backgroundColor: '#5B9DF0',
          tension: 0.4, borderWidth: 2.5, pointRadius: 3,
          pointBackgroundColor: '#fff', pointBorderColor: '#5B9DF0',
          pointBorderWidth: 2, order: 1 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: true, position: 'bottom',
          labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, font: { size: 11 } } },
      },
      scales: {
        y: { position: 'left', beginAtZero: true, grid: { color: '#f0f2f6' },
          ticks: { font: { size: 10 }, color: '#90a0b0' } },
        y1: { position: 'right', beginAtZero: true, grid: { display: false },
          ticks: { font: { size: 10 }, color: '#90a0b0' } },
        x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#90a0b0' } },
      },
    },
  });
}

onMounted(async () => {
  try {
    loading.value = true;
    // wcw5.25修改-每次进入页面都重新加载数据，确保图表渲染
    const [dashRes] = await Promise.all([
      analysisAPI.dashboard(),
      goals.fetchGoals(),
    ]);
    if (dashRes.data.success) {
      dashboardData.value = dashRes.data.data;
      // 延迟一点确保 canvas 元素已挂载
      setTimeout(() => renderDashChart(), 50);
    }
  } catch (e) {
    console.error('Failed to load dashboard:', e);
  } finally {
    loading.value = false;
  }
});

// wcw5.25修改-keepAlive缓存后重新激活时重新加载数据和渲染图表
onActivated(async () => {
  try {
    loading.value = true;
    const [dashRes] = await Promise.all([
      analysisAPI.dashboard(),
      goals.fetchGoals(),
    ]);
    if (dashRes.data.success) {
      dashboardData.value = dashRes.data.data;
      setTimeout(() => renderDashChart(), 50);
    }
  } catch (e) {
    console.error('Failed to reload dashboard:', e);
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  // wcw5.25修改-使用统一工具销毁图表
  destroyAllCharts();
});
</script>