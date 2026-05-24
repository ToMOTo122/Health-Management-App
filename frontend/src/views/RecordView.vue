<template>
  <AppLayout>
    <div class="page-header">
      <h1>健康记录</h1>
      <p>记录和管理你的每日健康数据</p>
    </div>

    <div class="tabs">
      <button v-for="t in tabs" :key="t.key" :class="['tab', { active: activeTab === t.key }]"
        @click="activeTab = t.key; fetchData()">{{ t.label }}</button>
    </div>

    <div class="card mb-4">
      <component :is="currentForm" :editing="editingRecord" @saved="onSaved" @cancel="editingRecord = null" />
    </div>

    <div class="card">
      <div class="card-header">
        <h3>历史记录</h3>
        <input class="form-input" style="width:180px" type="date" v-model="filterDate" @change="fetchData()" />
      </div>
      <LoadingSpinner v-if="loading" />
      <div v-else-if="records.length === 0" class="empty-state">
        <i class="fa-solid fa-inbox"></i>
        <p>暂无记录</p>
      </div>
      <table v-else class="data-table">
        <thead><tr><th>日期</th><th v-for="h in tableHeaders" :key="h">{{ h }}</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="r in records" :key="r.id">
            <td>{{ r.record_date?.split('T')[0] || r.record_date }}</td>
            <td v-for="h in tableHeaders" :key="h">{{ formatCell(r, h) }}</td>
            <td>
              <button class="btn btn-sm btn-outline" @click="editRecord(r)" style="margin-right:6px"><i class="fa-solid fa-pen"></i></button>
              <button class="btn btn-sm btn-danger" @click="deleteRec(r.id)"><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import AppLayout from '../components/layout/AppLayout.vue';
import LoadingSpinner from '../components/common/LoadingSpinner.vue';
import SleepForm from '../components/records/SleepForm.vue';
import StepsForm from '../components/records/StepsForm.vue';
import WaterForm from '../components/records/WaterForm.vue';
import ExerciseForm from '../components/records/ExerciseForm.vue';
import DietForm from '../components/records/DietForm.vue';
import StressForm from '../components/records/StressForm.vue';
import CycleForm from '../components/records/CycleForm.vue';
import { useRecordsStore } from '../stores/records.store';
import { useToast } from '../composables/useToast';

const store = useRecordsStore();
const { showToast } = useToast();

const activeTab = ref('sleep');
const editingRecord = ref(null);
const filterDate = ref('');

const tabs = [
  { key: 'sleep', label: '💤 睡眠' },
  { key: 'steps', label: '👟 步数' },
  { key: 'water', label: '💧 饮水' },
  { key: 'exercise', label: '🏃 运动' },
  { key: 'diet', label: '🍽 饮食' },
  { key: 'stress', label: '😰 压力' },
  { key: 'cycle', label: '📅 生理周期' },
];

const formMap = { sleep: SleepForm, steps: StepsForm, water: WaterForm, exercise: ExerciseForm, diet: DietForm, stress: StressForm, cycle: CycleForm };
const currentForm = computed(() => formMap[activeTab.value]);
const records = computed(() => store.records);
const loading = computed(() => store.loading);

const headerMap = {
  sleep: ['睡眠时长(h)', '入睡时间', '质量'],
  steps: ['步数'],
  water: ['饮水量(ml)'],
  exercise: ['运动类型', '时长(min)', '热量(kcal)'],
  diet: ['食物', '摄入时间', '热量(kcal)'],
  stress: ['压力等级', '评分'],
  cycle: ['开始日期', '结束日期', '周期天数'],
};

const tableHeaders = computed(() => headerMap[activeTab.value] || []);

function formatCell(record, header) {
  if (header.includes('时长')) return record.duration_h + 'h';
  if (header.includes('步数')) return record.steps?.toLocaleString();
  if (header.includes('饮水')) return record.amount_ml + 'ml';
  if (header.includes('运动类型')) return record.exercise_type;
  if (header.includes('时长(min)')) return record.duration_min + 'min';
  if (header.includes('热量')) return record.calories_kcal + 'kcal';
  if (header.includes('入睡时间')) return record.sleep_time;
  if (header.includes('质量')) return { good: '好', fair: '一般', poor: '差' }[record.quality] || record.quality;
  if (header.includes('食物')) return record.food_name;
  if (header.includes('摄入时间')) return record.meal_time;
  if (header.includes('压力等级')) return { low: '低', medium: '中', high: '高' }[record.level] || record.level;
  if (header.includes('评分')) return record.score;
  if (header.includes('开始日期')) return record.start_date?.split('T')[0] || record.start_date;
  if (header.includes('结束日期')) return record.end_date?.split('T')[0] || record.end_date || '-';
  if (header.includes('周期天数')) return record.cycle_length || '-';
  return '-';
}

function editRecord(record) { editingRecord.value = { ...record }; }

async function fetchData() {
  const params = {};
  if (filterDate.value) params.date = filterDate.value;
  await store.fetchRecords(activeTab.value, params);
}

async function onSaved() {
  editingRecord.value = null;
  await fetchData();
  showToast('记录已保存', 'success');
}

async function deleteRec(id) {
  if (!confirm('确定删除这条记录？')) return;
  try {
    const { data } = await store.deleteRecord(activeTab.value, id);
    if (data.success) { await fetchData(); showToast('已删除', 'info'); }
    else showToast(data.error?.message || '删除失败', 'error');
  } catch (err) {
    showToast(err.response?.data?.error?.message || '删除失败', 'error');
  }
}

onMounted(fetchData);
</script>
