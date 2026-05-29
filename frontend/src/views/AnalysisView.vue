<template>
  <AppLayout>
    <div class="analysis-root">

      <!-- Ambient background orbs -->
      <div class="bg-orb orb-1"></div>
      <div class="bg-orb orb-2"></div>
      <div class="bg-orb orb-3"></div>

      <!-- ══ TOP HEADER ══ -->
      <header class="page-header">
        <div class="header-left">
          <div class="header-eyebrow">
            <span class="live-dot"></span>
            <span>健康洞察中心</span>
          </div>
          <h1 class="page-title">数据分析</h1>
        </div>
        <div class="header-right">
          <!-- Period pills -->
          <div class="period-switcher">
            <button
              v-for="p in periods"
              :key="p.key"
              :class="['period-btn', { active: period === p.key }]"
              @click="changePeriod(p.key)"
            >
              {{ p.label }}
            </button>
          </div>
        </div>
      </header>

      <!-- ══ TYPE NAV ══ -->
      <nav class="type-nav">
        <button
          v-for="t in types"
          :key="t.key"
          :class="['type-chip', { active: activeType === t.key }]"
          @click="switchType(t.key)"
        >
          <span class="chip-icon" :style="{ background: t.gradient }">
            <span v-html="t.icon"></span>
          </span>
          <span class="chip-label">{{ t.label }}</span>
          <span v-if="activeType === t.key" class="chip-badge">▸</span>
        </button>
      </nav>

      <!-- ══ MAIN CONTENT ══ -->
      <main class="main-grid">

        <!-- LEFT: chart area -->
        <section class="chart-panel">

          <!-- Stats row -->
          <div class="stat-row">
            <div v-for="s in currentStats" :key="s.label" class="stat-card">
              <div class="stat-icon" :style="{ color: currentType.color }">
                <span v-html="s.icon"></span>
              </div>
              <div class="stat-body">
                <div class="stat-value">
                  <span class="stat-num">{{ s.value }}</span>
                  <span class="stat-unit">{{ s.unit }}</span>
                </div>
                <div class="stat-label">{{ s.label }}</div>
              </div>
              <div class="stat-trend" :class="s.trend > 0 ? 'up' : s.trend < 0 ? 'down' : 'flat'">
                <span>{{ s.trend > 0 ? '↑' : s.trend < 0 ? '↓' : '—' }}</span>
                <span v-if="s.trend !== 0">{{ Math.abs(s.trend) }}%</span>
              </div>
            </div>
          </div>

          <!-- Chart types toggle -->
          <div class="chart-toolbar">
            <span class="toolbar-title">
              <span class="type-dot" :style="{ background: currentType.color }"></span>
              {{ currentType.label }} · {{ periodLabel }} 趋势
            </span>
            <div class="chart-type-btns">
              <button
                v-for="ct in chartDisplayTypes"
                :key="ct.key"
                :class="['ct-btn', { active: chartDisplayType === ct.key }]"
                @click="chartDisplayType = ct.key; renderChart()"
                :title="ct.label"
              >
                <span v-html="ct.icon"></span>
              </button>
            </div>
          </div>

          <!-- Chart canvas -->
          <div class="chart-box">
            <div v-if="chartLoading" class="chart-loading">
              <div class="loading-bars">
                <span v-for="i in 7" :key="i" :style="{ animationDelay: i * 0.08 + 's' }"></span>
              </div>
              <p>加载数据中…</p>
            </div>
            <canvas ref="chartCanvas" v-show="!chartLoading"></canvas>
            <!-- Goal reference line label -->
            <div v-if="currentType.goalKey && !chartLoading" class="goal-label">
              <svg width="12" height="2"><line x1="0" y1="1" x2="12" y2="1" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3 2"/></svg>
              目标线
            </div>
          </div>

          <!-- Heatmap (for month/quarter only) -->
          <div v-if="period !== 'week'" class="heatmap-section">
            <div class="section-label">打卡热力图</div>
            <div class="heatmap-grid">
              <div
                v-for="(cell, i) in heatmapCells"
                :key="i"
                class="hm-cell"
                :style="{ opacity: cell.opacity, background: currentType.color }"
                :title="cell.date + ': ' + cell.value"
              ></div>
            </div>
          </div>

          <!-- Distribution bar -->
          <div class="dist-section">
            <div class="section-label">区间分布</div>
            <div class="dist-bars">
              <div v-for="d in distribution" :key="d.label" class="dist-row">
                <span class="dist-label">{{ d.label }}</span>
                <div class="dist-bar-bg">
                  <div
                    class="dist-bar-fill"
                    :style="{ width: d.pct + '%', background: currentType.gradient }"
                  ></div>
                </div>
                <span class="dist-pct">{{ d.pct }}%</span>
              </div>
            </div>
          </div>

        </section>

        <!-- RIGHT: AI panel -->
        <aside class="ai-panel">

          <!-- Score card -->
          <div class="score-card">
            <div class="score-ring-wrap">
              <svg class="score-ring" viewBox="0 0 100 100">
                <circle class="ring-bg" cx="50" cy="50" r="40"/>
                <circle
                  class="ring-fill"
                  cx="50" cy="50" r="40"
                  :stroke="currentType.color"
                  :stroke-dasharray="`${weekScore * 2.51} 251`"
                />
              </svg>
              <div class="score-center">
                <span class="score-num">{{ weekScore }}</span>
                <span class="score-tag">分</span>
              </div>
            </div>
            <div class="score-info">
              <div class="score-grade" :style="{ color: currentType.color }">{{ weekGrade }}</div>
              <div class="score-sub">本{{ periodLabel }}综合评分</div>
              <div class="score-breakdown">
                <div v-for="b in scoreBars" :key="b.name" class="sb-row">
                  <span class="sb-name">{{ b.name }}</span>
                  <div class="sb-bar-bg">
                    <div class="sb-bar-fill" :style="{ width: b.pct + '%', background: b.color }"></div>
                  </div>
                  <span class="sb-val">{{ b.pct }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- AI insight -->
          <div class="ai-card">
            <div class="ai-card-header">
              <div class="ai-avatar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
              </div>
              <span>AI 健康助理</span>
              <span class="ai-tag">实时分析</span>
            </div>

            <div class="ai-body" ref="aiBodyRef">
              <div v-if="aiLoading" class="ai-typing">
                <span></span><span></span><span></span>
              </div>
              <div v-else class="ai-text" v-html="formattedAI"></div>
            </div>

            <div class="ai-actions">
              <button class="ai-btn" @click="refreshAI">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
                重新分析
              </button>
              <button class="ai-btn" @click="askFollowUp">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                追问
              </button>
            </div>
          </div>

          <!-- Quick suggestions -->
          <div class="suggest-card">
            <div class="suggest-title">💡 今日建议</div>
            <div class="suggest-list">
              <div v-for="(s, i) in suggestions" :key="i" class="suggest-item">
                <span class="suggest-dot" :style="{ background: currentType.color }"></span>
                <span>{{ s }}</span>
              </div>
            </div>
          </div>

          <!-- Milestones -->
          <div class="milestone-card">
            <div class="milestone-title">🏅 近期里程碑</div>
            <div v-for="m in milestones" :key="m.text" class="milestone-row">
              <span class="milestone-icon">{{ m.icon }}</span>
              <div class="milestone-body">
                <div class="milestone-text">{{ m.text }}</div>
                <div class="milestone-date">{{ m.date }}</div>
              </div>
              <span class="milestone-badge" :class="m.done ? 'done' : 'pending'">
                {{ m.done ? '✓' : '…' }}
              </span>
            </div>
          </div>

        </aside>
      </main>

      <!-- ══ REPORT MODAL ══ -->
      <transition name="modal">
        <div v-if="showReport" class="modal-overlay" @click.self="showReport = false">
          <div class="modal-box">
            <button class="modal-close" @click="showReport = false">✕</button>
            <div class="modal-header">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              <span>{{ periodLabel }}健康总结报告</span>
            </div>
            <div class="modal-body" v-html="reportContent"></div>
            <div class="modal-footer">
              <button class="btn-copy" @click="copyReport">📋 复制</button>
            </div>
          </div>
        </div>
      </transition>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import AppLayout from '../components/layout/AppLayout.vue';
import { analysisAPI } from '../api/analysis.api';
import { chatAPI } from '../api/chat.api';
import Chart from 'chart.js/auto';

// ── State ──────────────────────────────────────────────
const period = ref('week');
const activeType = ref('sleep');
const chartDisplayType = ref('line');
const chartLoading = ref(false);
const aiLoading = ref(false);
const reportLoading = ref(false);
const showReport = ref(false);
const reportContent = ref('');
const chartCanvas = ref(null);
const aiBodyRef = ref(null);
let chartInstance = null;

const trendData = ref({ labels: [], values: [] });
const aiText = ref('');
const weekStats = ref(null);
const goalStatus = ref(null);

// ── Config ─────────────────────────────────────────────
const periods = [
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'quarter', label: '本季度' },
];

const types = [
  {
    key: 'sleep', label: '睡眠',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>',
    color: '#818cf8', gradient: 'linear-gradient(135deg,#818cf8,#6366f1)',
    unit: 'h', goalKey: 'sleep_hours', defaultGoal: 8,
  },
  {
    key: 'steps', label: '步数',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"/></svg>',
    color: '#34d399', gradient: 'linear-gradient(135deg,#34d399,#10b981)',
    unit: '步', goalKey: 'steps_daily', defaultGoal: 10000,
  },
  {
    key: 'water', label: '饮水',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z"/></svg>',
    color: '#38bdf8', gradient: 'linear-gradient(135deg,#38bdf8,#0ea5e9)',
    unit: 'ml', goalKey: 'water_ml', defaultGoal: 2000,
  },
  {
    key: 'exercise', label: '运动',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"/></svg>',
    color: '#fb923c', gradient: 'linear-gradient(135deg,#fb923c,#f97316)',
    unit: 'min', goalKey: 'exercise_min', defaultGoal: 30,
  },
  {
    key: 'calories', label: '热量',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05h-5V1h-1.97v4.05h-4.97l.3 2.34c1.71.47 3.31 1.32 4.27 2.26 1.44 1.42 2.43 2.89 2.43 5.29v8.05zM1 21.99V21h15.03v.99c0 .55-.45 1-1.01 1H2.01c-.56 0-1.01-.45-1.01-1zm15.03-7c0-8-15.03-8-15.03 0h15.03zM1.02 17h15v2h-15z"/></svg>',
    color: '#f472b6', gradient: 'linear-gradient(135deg,#f472b6,#ec4899)',
    unit: 'kcal', goalKey: 'calories_kcal', defaultGoal: 2000,
  },
];

const chartDisplayTypes = [
  { key: 'line', label: '折线图', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>' },
  { key: 'bar', label: '柱状图', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="18" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="2" y="13" width="4" height="8"/></svg>' },
  { key: 'area', label: '面积图', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 20h20M2 20l5-8 4 4 4-6 5 4"/></svg>' },
];

// ── Computed ───────────────────────────────────────────
const currentType = computed(() => types.find(t => t.key === activeType.value) || types[0]);
const periodLabel = computed(() => ({ week: '周', month: '月', quarter: '季度' }[period.value]));

const weekScore = computed(() => weekStats.value?.score || 0);
const weekGrade = computed(() => weekStats.value?.grade || '--');

const scoreBars = computed(() => {
  if (!weekStats.value?.breakdown) return [];
  const colors = ['#818cf8', '#34d399', '#38bdf8', '#fb923c'];
  return (weekStats.value.breakdown || []).map((b, i) => ({ ...b, color: colors[i % colors.length] }));
});

const currentStats = computed(() => {
  const v = trendData.value.values;
  if (!v.length) return [];
  const avg = v.reduce((a, b) => a + b, 0) / v.length;
  const max = Math.max(...v);
  const recent = v.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, v.length);
  const older = v.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(3, v.length);
  const trend = older ? Math.round(((recent - older) / older) * 100) : 0;
  const t = currentType.value;
  return [
    { icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2.05v2.02c3.95.49 7 3.85 7 7.93 0 3.21-1.81 6-4.72 7.28L13 17v5l5-3-1.22-1.22C19.91 16.26 22 13.28 22 12c0-5.18-3.95-9.45-9-9.95zM11 2.05C5.95 2.55 2 6.82 2 12c0 3.28 2.09 6.26 5.22 7.78L11 22v-5l-2.28 2.28C6.81 18 5 15.21 5 12c0-4.08 3.05-7.44 7-7.93V2.05z"/></svg>', label: '平均值', value: Math.round(avg * 10) / 10, unit: t.unit, trend },
    { icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>', label: '最高值', value: Math.round(max * 10) / 10, unit: t.unit, trend: 0 },
    { icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>', label: '有记录天数', value: v.filter(x => x > 0).length, unit: '天', trend: 0 },
  ];
});

const heatmapCells = computed(() => {
  const v = trendData.value.values;
  const labels = trendData.value.labels;
  if (!v.length) return [];
  const max = Math.max(...v, 1);
  return v.map((val, i) => ({
    opacity: val ? 0.15 + (val / max) * 0.85 : 0.05,
    value: val,
    date: labels[i] || '',
  }));
});

const distribution = computed(() => {
  const v = trendData.value.values.filter(x => x > 0);
  if (!v.length) return [];
  const max = Math.max(...v);
  const buckets = [
    { label: '优秀', min: max * 0.8, max: Infinity },
    { label: '良好', min: max * 0.6, max: max * 0.8 },
    { label: '一般', min: max * 0.3, max: max * 0.6 },
    { label: '偏低', min: 0, max: max * 0.3 },
  ];
  return buckets.map(b => ({
    label: b.label,
    pct: Math.round((v.filter(x => x >= b.min && x < b.max).length / v.length) * 100),
  }));
});

const formattedAI = computed(() => {
  if (!aiText.value) return '';
  return aiText.value
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
    .replace(/^• /gm, '<span class="ai-bullet">•</span> ');
});

const suggestions = computed(() => {
  const t = activeType.value;
  const maps = {
    sleep: ['今晚22:30前放下手机，准备入睡', '睡前1小时避免剧烈运动', '保持卧室温度在18-22°C'],
    steps: ['午餐后步行15分钟可达标60%', '尝试用楼梯替代电梯', '步行通勤是最高效的增步方式'],
    water: ['设置每小时饮水提醒', '晨起一杯温水激活代谢', '运动后及时补水150-300ml'],
    exercise: ['每周至少3天有氧运动', '运动前热身5分钟可减少受伤', '力量训练与有氧交替进行效果更佳'],
    calories: ['早餐应占全天热量30%', '晚餐尽量在19:00前完成', '细嚼慢咽有助于控制摄入量'],
  };
  return maps[t] || [];
});

const milestones = computed(() => [
  { icon: '🌙', text: '连续7天睡眠达标', date: '3天前', done: true },
  { icon: '👟', text: '单日步数破万', date: '昨天', done: true },
  { icon: '💧', text: '连续30天饮水记录', date: '进行中', done: false },
  { icon: '🏃', text: '本月运动超10小时', date: '进行中', done: false },
]);

// ── Methods ────────────────────────────────────────────
async function loadData() {
  chartLoading.value = true;
  try {
    const [trendRes, weekRes, goalRes] = await Promise.all([
      analysisAPI.trend(activeType.value, period.value),
      analysisAPI.weekStats ? analysisAPI.weekStats() : Promise.resolve(null),
      analysisAPI.goalStatus ? analysisAPI.goalStatus() : Promise.resolve(null),
    ]);

    if (trendRes?.data?.success) {
      trendData.value = trendRes.data.data;
    } else {
      // fallback mock data for dev
      const n = period.value === 'week' ? 7 : period.value === 'month' ? 30 : 90;
      trendData.value = {
        labels: Array.from({ length: n }, (_, i) => {
          const d = new Date(); d.setDate(d.getDate() - (n - 1 - i));
          return d.toISOString().split('T')[0];
        }),
        values: Array.from({ length: n }, () => Math.round(Math.random() * 60 + 20)),
      };
    }

    weekStats.value = weekRes?.data?.data || { score: 72, grade: '良好', breakdown: [
      { name: '睡眠', pct: 80 }, { name: '步数', pct: 65 }, { name: '饮水', pct: 70 }, { name: '运动', pct: 73 },
    ]};
    goalStatus.value = goalRes?.data?.data || null;
  } finally {
    chartLoading.value = false;
    await nextTick();
    renderChart();
    loadAI();
  }
}

function renderChart() {
  if (!chartCanvas.value) return;
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

  const t = currentType.value;
  const labels = trendData.value.labels.map(d => {
    const date = new Date(d);
    return period.value === 'week'
      ? ['日', '一', '二', '三', '四', '五', '六'][date.getDay()]
      : `${date.getMonth() + 1}/${date.getDate()}`;
  });
  const values = trendData.value.values;
  const isArea = chartDisplayType.value === 'area';
  const isBar = chartDisplayType.value === 'bar';

  const ctx = chartCanvas.value.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 280);
  gradient.addColorStop(0, t.color + '55');
  gradient.addColorStop(1, t.color + '00');

  chartInstance = new Chart(chartCanvas.value, {
    type: isBar ? 'bar' : 'line',
    data: {
      labels,
      datasets: [{
        label: t.label,
        data: values,
        borderColor: t.color,
        backgroundColor: isBar ? t.color + 'cc' : (isArea || chartDisplayType.value === 'area') ? gradient : 'transparent',
        fill: isArea || chartDisplayType.value === 'line' ? (chartDisplayType.value === 'area') : false,
        tension: 0.45,
        borderWidth: 2.5,
        pointBackgroundColor: t.color,
        pointRadius: isBar ? 0 : 4,
        pointHoverRadius: 7,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        borderRadius: isBar ? 6 : 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600, easing: 'easeInOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e1b4b',
          titleColor: '#e0e7ff',
          bodyColor: '#c7d2fe',
          borderColor: t.color,
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: ctx => ` ${ctx.parsed.y} ${t.unit}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(148,163,184,0.08)', drawBorder: false },
          ticks: { color: '#475569', font: { size: 11, family: 'Nunito' } },
        },
        y: {
          grid: { color: 'rgba(148,163,184,0.08)', drawBorder: false },
          ticks: { color: '#475569', font: { size: 11 }, callback: v => v + t.unit },
          beginAtZero: true,
        },
      },
    },
  });
}

async function loadAI() {
  aiLoading.value = true;
  aiText.value = '';
  try {
    const avg = trendData.value.values.length
      ? (trendData.value.values.reduce((a, b) => a + b, 0) / trendData.value.values.length).toFixed(1)
      : 0;
    const t = currentType.value;
    const prompt = `用户的${periodLabel.value}${t.label}数据分析：平均值 ${avg}${t.unit}，目标 ${t.defaultGoal}${t.unit}。请用简洁友好的语气给出2-3条专业健康洞察，包括达标情况评价和具体改善建议，使用emoji点缀，控制在120字以内。`;

    const res = await chatAPI.send(prompt);
    aiText.value = res?.data?.data?.reply
      || `**${t.label}分析**\n\n本${periodLabel.value}平均${t.label}为 **${avg}${t.unit}**，${parseFloat(avg) >= t.defaultGoal ? '已达到目标 🎉 继续保持！' : `距目标 ${t.defaultGoal}${t.unit} 还有提升空间。`}\n\n• 建议保持规律记录，持续追踪趋势\n• 参考右侧每日建议制定改善计划\n• 设置合理的阶段性小目标`;
  } catch {
    aiText.value = `本${periodLabel.value}数据已加载完成，AI 分析服务暂时不可用，请稍后重试。`;
  } finally {
    aiLoading.value = false;
  }
}

async function generateReport() {
  reportLoading.value = true;
  try {
    const summary = weekStats.value;
    const t = currentType.value;
    const prompt = `请为用户生成${periodLabel.value}健康总结报告，数据如下：综合评分${summary?.score || 70}分，等级${summary?.grade || '良好'}。各指标：${(summary?.breakdown || []).map(b => `${b.name}达标率${b.pct}%`).join('、')}。请生成一份结构清晰、有数据洞察、有行动建议的健康报告，使用Markdown格式，包含：总体评价、各指标分析、下${periodLabel.value}建议。`;
    const res = await chatAPI.send(prompt);
    reportContent.value = formatReport(res?.data?.data?.reply || generateLocalReport(summary));
  } catch {
    reportContent.value = formatReport(generateLocalReport(weekStats.value));
  } finally {
    reportLoading.value = false;
    showReport.value = true;
  }
}

function generateLocalReport(s) {
  return `## 🏥 ${periodLabel.value}健康总结报告\n\n**综合评分：${s?.score || '--'}分 · ${s?.grade || '--'}**\n\n### 各指标分析\n${(s?.breakdown || []).map(b => `- **${b.name}**：达标率 ${b.pct}%，${b.pct >= 80 ? '表现优秀' : b.pct >= 60 ? '有待提升' : '需要重点关注'}`).join('\n')}\n\n### 下${periodLabel.value}建议\n- 保持已达标项目的良好习惯\n- 重点提升低分指标，设置每日提醒\n- 建议每周进行一次数据回顾`;
}

function formatReport(text) {
  return text
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/\n/g, '<br>');
}

function refreshAI() { loadAI(); }
function askFollowUp() {
  // Navigate to chat with pre-filled context
  window.location.href = '/chat?context=analysis&type=' + activeType.value;
}

function switchType(key) {
  activeType.value = key;
  chartDisplayType.value = 'line';
  loadData();
}

function changePeriod(p) {
  period.value = p;
  loadData();
}

function copyReport() {
  const text = reportContent.value.replace(/<[^>]+>/g, '');
  navigator.clipboard.writeText(text).then(() => alert('已复制到剪贴板'));
}

onMounted(loadData);
</script>

<style scoped>
/* ── Google Font import ── */
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Sora:wght@400;600;700&display=swap');

/* ── Root & Background ── */
.analysis-root {
  min-height: auto;
  padding: 12px 24px 24px;
  background: #f6f8fc;
  color: #1e293b;
  font-family: 'Nunito', sans-serif;
  position: relative;
  overflow-x: hidden;
}

/* Ambient orbs */
.bg-orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}

.analysis-root > * { position: relative; z-index: 1; }

/* ── Header ── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  background: #ffffff;
  border-radius: 18px;
  padding: 18px 22px;
  border: 1px solid #e4e2f0;
  box-shadow:
    0 2px 10px rgba(15,23,42,0.04);
}
.header-left {}
.header-eyebrow {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: #062d64;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.live-dot {
  width: 7px; height: 7px;
  background: #34d399;
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(52,211,153,0.2);
  animation: pulse 2s infinite;
}
@keyframes pulse { 0%,100%{box-shadow:0 0 0 3px rgba(52,211,153,0.2)} 50%{box-shadow:0 0 0 6px rgba(52,211,153,0.05)} }
.page-title {
  font-family: 'Sora', sans-serif;
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.02em;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 14px;
}
.period-switcher {
  display: flex;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 4px;
  gap: 2px;
}
.period-btn {
  padding: 7px 16px;
  border: none;
  background: transparent;
  color: #2c3747;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Nunito', sans-serif;
}
.period-btn.active {
  background: rgba(255,255,255,0.12);
  color: #031e39;
  box-shadow: 0 1px 6px rgba(0,0,0,0.3);
}
.btn-report {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: 1px solid #c7d2fe;
  background: #eef2ff;
  color: #4f46e5;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-report:hover:not(:disabled) { background: rgba(99,102,241,0.28); color: #e0e7ff; }
.btn-report:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-report-icon { display: flex; align-items: center; }

/* ── Type nav ── */
.type-nav {
  display: flex;
  gap: 10px;
  margin-bottom: 22px;
  flex-wrap: wrap;
}
.type-chip {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 18px 8px 10px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  border-radius: 14px;
  color: #475569;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.22s;
}
.type-chip:hover { background: rgba(255,255,255,0.08); color: #041d3c; }
.type-chip.active {
  background: #eef2ff;
  border-color: #c7d2fe;
  color: #4338ca;
}
.chip-icon {
  width: 30px; height: 30px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}
.chip-badge {
  font-size: 10px;
  color: #818cf8;
  margin-left: auto;
}

/* ── Main grid ── */
.main-grid {
  display: grid;
  grid-template-columns: 1.45fr 0.72fr;
  gap: 18px;
  align-items: start;
}
/* ── Chart panel ── */
.chart-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Stat row */
.stat-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.stat-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: all 0.2s;
  box-shadow:
    0 1px 6px rgba(15,23,42,0.04);
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 8px 24px rgba(15,23,42,0.08);
}
.stat-icon {
  width: 38px; height: 38px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.06);
  border-radius: 11px;
  flex-shrink: 0;
}
.stat-body { flex: 1; min-width: 0; }
.stat-value { display: flex; align-items: baseline; gap: 3px; }
.stat-num { font-size: 22px; font-weight: 800; color: #04203b; font-family: 'Sora', sans-serif; }
.stat-unit { font-size: 12px; color: #263a57; font-weight: 600; }
.stat-label { font-size: 12px; color: #042758; margin-top: 2px; }
.stat-trend { font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
.stat-trend.up { color: #34d399; }
.stat-trend.down { color: #f87171; }
.stat-trend.flat { color: #061a35; }

/* Chart toolbar */
.chart-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px;
}
.toolbar-title {
  color: #1e293b;
  font-weight: 700;
}
.type-dot { width: 8px; height: 8px; border-radius: 50%; }
.chart-type-btns { display: flex; gap: 4px; }
.ct-btn {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(15,23,42,0.04);
  border-radius: 9px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.18s;
}
.ct-btn:hover { color: #05101f; background: rgba(255,255,255,0.08); }
.ct-btn.active { color: #e0e7ff; background: rgba(99,102,241,0.2); border-color: rgba(99,102,241,0.35); }

/* Chart box */
.chart-box {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 18px;
  min-height: 320px;
  position: relative;
}
.chart-box canvas { width: 100% !important; height: 100% !important; }
.goal-label {
  position: absolute;
  top: 14px; right: 18px;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: #f59e0b;
}
.chart-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #64748b;
}
.loading-bars {
  display: flex;
  gap: 4px;
  align-items: flex-end;
  height: 40px;
}
.loading-bars span {
  width: 5px;
  background: rgba(99,102,241,0.4);
  border-radius: 3px;
  animation: bars 0.9s ease-in-out infinite alternate;
}
@keyframes bars {
  from { height: 8px; opacity: 0.4; }
  to { height: 36px; opacity: 1; }
}

/* Heatmap */
.heatmap-section, .dist-section {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 16px;
  padding: 16px 18px;
}
.section-label {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 12px;
}
.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18px, 1fr));
  gap: 3px;
}
.hm-cell {
  width: 18px; height: 18px;
  border-radius: 4px;
  transition: opacity 0.3s;
  cursor: pointer;
}
.hm-cell:hover { outline: 1px solid rgba(255,255,255,0.3); }

/* Distribution */
.dist-bars { display: flex; flex-direction: column; gap: 8px; }
.dist-row { display: flex; align-items: center; gap: 10px; }
.dist-label { width: 32px; font-size: 12px; color: #64748b; text-align: right; flex-shrink: 0; }
.dist-bar-bg { flex: 1; height: 8px; background: rgba(255,255,255,0.07); border-radius: 4px; overflow: hidden; }
.dist-bar-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }
.dist-pct { width: 34px; font-size: 12px; color: #03142b; font-weight: 700; text-align: right; }

/* ── AI Panel ── */
.ai-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Score card */
.score-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(15,23,42,0.04);
  border-radius: 20px;
  padding: 20px;
  display: flex;
  gap: 18px;
  align-items: center;
}
.score-ring-wrap {
  position: relative;
  width: 90px; height: 90px;
  flex-shrink: 0;
}
.score-ring {
  width: 90px; height: 90px;
  transform: rotate(-90deg);
}
.ring-bg {
  fill: none;
  stroke: rgba(255,255,255,0.07);
  stroke-width: 8;
}
.ring-fill {
  fill: none;
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dasharray 0.8s ease;
  filter: drop-shadow(0 0 6px currentColor);
}
.score-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.score-num { font-size: 22px; font-weight: 800; font-family: 'Sora', sans-serif; color: #041c34; }
.score-tag { font-size: 11px; color: #64748b; margin-top: -2px; }
.score-info { flex: 1; min-width: 0; }
.score-grade { font-size: 17px; font-weight: 800; margin-bottom: 2px; }
.score-sub { font-size: 12px; color: #64748b; margin-bottom: 12px; }
.score-breakdown { display: flex; flex-direction: column; gap: 7px; }
.sb-row { display: flex; align-items: center; gap: 8px; }
.sb-name { width: 28px; font-size: 11px; color: #64748b; flex-shrink: 0; }
.sb-bar-bg { flex: 1; height: 5px; background: rgba(255,255,255,0.07); border-radius: 3px; overflow: hidden; }
.sb-bar-fill { height: 100%; border-radius: 3px; transition: width 0.6s; }
.sb-val { width: 30px; font-size: 11px; color: #061730; text-align: right; }

/* AI card */
.ai-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  overflow: hidden;
  box-shadow:
    0 2px 8px rgba(15,23,42,0.05);
}
.ai-card-header {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 14px 18px 12px;
  border-bottom: 1px solid rgba(99,102,241,0.12);
  font-size: 13px;
  font-weight: 700;
  color: #a5b4fc;
}
.ai-avatar {
  width: 28px; height: 28px;
  background: rgba(99,102,241,0.2);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: #818cf8;
  flex-shrink: 0;
}
.ai-tag {
  margin-left: auto;
  font-size: 10px;
  color: #34d399;
  background: rgba(52,211,153,0.1);
  border: 1px solid rgba(52,211,153,0.2);
  padding: 2px 8px;
  border-radius: 20px;
}
.ai-body { padding: 14px 18px; min-height: 100px; }
.ai-text {
  color: #334155;
  line-height: 1.8;
  font-size: 14px;
}
.ai-text :deep(strong) { color: #e0e7ff; }
.ai-text :deep(.ai-bullet) { color: #818cf8; }
.ai-typing {
  display: flex;
  gap: 5px;
  padding: 20px 0;
  justify-content: center;
}
.ai-typing span {
  width: 8px; height: 8px;
  background: #818cf8;
  border-radius: 50%;
  animation: typing 1.2s ease-in-out infinite;
}
.ai-typing span:nth-child(2) { animation-delay: 0.2s; }
.ai-typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }
.ai-actions {
  display: flex;
  gap: 8px;
  padding: 0 18px 14px;
}
.ai-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px;
  border: 1px solid rgba(99,102,241,0.2);
  background: rgba(99,102,241,0.08);
  color: #a5b4fc;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s;
  font-family: 'Nunito', sans-serif;
}
.ai-btn:hover { background: rgba(99,102,241,0.18); border-color: rgba(99,102,241,0.35); }

/* Suggest card */
.suggest-card, .milestone-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 16px;
  padding: 16px 18px;
}
.suggest-title, .milestone-title {
  font-size: 13px;
  font-weight: 700;
  color: #041630;
  margin-bottom: 12px;
}
.suggest-list { display: flex; flex-direction: column; gap: 8px; }
.suggest-item {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  font-size: 13px;
  color: #020d1c;
  line-height: 1.5;
}
.suggest-dot { width: 6px; height: 6px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }

/* Milestone card */
.milestone-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.milestone-row:last-child { border-bottom: none; }
.milestone-icon { font-size: 18px; flex-shrink: 0; }
.milestone-body { flex: 1; min-width: 0; }
.milestone-text { font-size: 13px; color: #031832; font-weight: 600; }
.milestone-date { font-size: 11px; color: #64748b; margin-top: 1px; }
.milestone-badge {
  width: 22px; height: 22px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}
.milestone-badge.done { background: rgba(52,211,153,0.15); color: #34d399; }
.milestone-badge.pending { background: rgba(148,163,184,0.1); color: #64748b; }

/* ── Report modal ── */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.75);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
  padding: 24px;
}
.modal-box {
  background: #1a1a2e;
  border: 1px solid rgba(99,102,241,0.25);
  border-radius: 24px;
  width: 100%;
  max-width: 560px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  padding: 28px;
}
.modal-close {
  position: absolute;
  top: 18px; right: 20px;
  background: rgba(255,255,255,0.07);
  border: none;
  color: #051730;
  width: 30px; height: 30px;
  border-radius: 50%;
  font-size: 13px;
  cursor: pointer;
}
.modal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 800;
  color: #e0e7ff;
  margin-bottom: 20px;
  font-family: 'Sora', sans-serif;
}
.modal-body {
  font-size: 14px;
  line-height: 1.8;
  color: #051b36;
}
.modal-body :deep(h2) { color: #e0e7ff; font-size: 16px; margin: 16px 0 8px; }
.modal-body :deep(h3) { color: #a5b4fc; font-size: 14px; margin: 12px 0 6px; }
.modal-body :deep(strong) { color: #041c34; }
.modal-body :deep(li) { margin: 4px 0 4px 16px; list-style: disc; }
.modal-footer {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
.btn-copy {
  padding: 9px 22px;
  background: rgba(99,102,241,0.15);
  border: 1px solid rgba(99,102,241,0.3);
  color: #a5b4fc;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Nunito', sans-serif;
}

/* ── Transitions ── */
.modal-enter-active, .modal-leave-active { transition: opacity 0.25s, transform 0.25s; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.96); }

/* ── Scrollbar ── */
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }

/* ── Responsive ── */
@media (max-width: 1024px) {
  .main-grid { grid-template-columns: 1fr; }
  .ai-panel { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .score-card { grid-column: 1 / -1; }
}
@media (max-width: 640px) {
  .analysis-root { padding: 16px 14px 28px; }
  .main-grid { gap: 14px; }
  .stat-row { grid-template-columns: 1fr 1fr; }
  .ai-panel { grid-template-columns: 1fr; }
  .header-right { flex-wrap: wrap; gap: 8px; }
  .type-nav { gap: 7px; }
  .type-chip { padding: 7px 12px 7px 8px; }
}
</style>