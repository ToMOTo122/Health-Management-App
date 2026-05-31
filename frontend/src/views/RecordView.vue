<template>
  <AppLayout>
    <div class="record-page" :class="`record-page--${activeTab}`">
      <div class="page-header record-page__header">
        <h1>健康记录</h1>
        <p>选择类型快速记录，在历史列表中查看、编辑或管理数据</p>
      </div>

      <div class="record-tabs" role="tablist">
        <button
          v-for="t in tabs"
          :key="t.key"
          type="button"
          role="tab"
          :aria-selected="activeTab === t.key"
          :class="['record-tab', `record-tab--${t.key}`, { active: activeTab === t.key }]"
          @click="activeTab = t.key; closeEditModal(); fetchData()"
        >
          <span class="record-tab__icon"><i class="fa-solid" :class="t.icon"></i></span>
          <span class="record-tab__label">{{ t.label }}</span>
        </button>
      </div>

      <div class="card record-card record-card--form mb-4" :class="`record-card--${activeTab}`">
        <component :is="currentForm" :key="'create-' + activeTab" @saved="onCreated" />
      </div>

      <RecordEditModal v-if="editingRecord" @close="closeEditModal">
        <component
          :is="currentForm"
          :key="'edit-' + editingRecord.id"
          :editing="editingRecord"
          @saved="onEditSaved"
          @cancel="closeEditModal"
        />
      </RecordEditModal>

      <div class="card record-card record-card--history" :class="`record-card--${activeTab}`">
        <div class="record-history__head">
          <div class="record-history__title-wrap">
            <h3>历史记录</h3>
            <span v-if="!loading && records.length > 0" class="record-count">{{ records.length }} 条</span>
          </div>
          <div class="record-filter">
            <label class="record-filter__label">
              <i class="fa-solid fa-calendar-days"></i>
              按日期筛选
            </label>
            <input
              class="form-input record-filter__input"
              type="date"
              v-model="filterDate"
              @change="fetchData()"
            />
          </div>
        </div>

        <div class="record-history__body">
          <LoadingSpinner v-if="loading" />
          <div v-else-if="records.length === 0" class="record-empty">
            <div class="record-empty__icon"><i class="fa-solid fa-inbox"></i></div>
            <p>暂无记录</p>
            <p class="record-empty__hint">在上方表单填写并保存，即可添加第一条记录</p>
          </div>
          <div v-else class="record-table-wrap">
            <table class="record-table">
              <thead>
                <tr>
                  <th v-if="showDateColumn">日期</th>
                  <th v-for="h in tableHeaders" :key="h">{{ h }}</th>
                  <th class="record-table__actions-col">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in records" :key="r.id">
                  <td v-if="showDateColumn" class="record-date-cell">{{ displayRecordDate(r) }}</td>
                  <td v-for="h in tableHeaders" :key="h">{{ formatCell(r, h) }}</td>
                  <td>
                    <div class="record-row-actions">
                      <button
                        type="button"
                        class="record-action record-action--edit"
                        title="编辑"
                        @click="editRecord(r)"
                      >
                        <i class="fa-solid fa-pen"></i>
                      </button>
                      <button
                        type="button"
                        class="record-action record-action--delete"
                        title="删除"
                        @click="deleteRec(r.id)"
                      >
                        <i class="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import LoadingSpinner from '../components/common/LoadingSpinner.vue';
import SleepForm from '../components/records/SleepForm.vue';
import StepsForm from '../components/records/StepsForm.vue';
import WaterForm from '../components/records/WaterForm.vue';
import ExerciseForm from '../components/records/ExerciseForm.vue';
import DietForm from '../components/records/DietForm.vue';
import StressForm from '../components/records/StressForm.vue';
import CycleForm from '../components/records/CycleForm.vue';
import RecordEditModal from '../components/records/RecordEditModal.vue';
import { useRecordsStore } from '../stores/records.store';
import { useToast } from '../composables/useToast';
import { formatDisplayDate, normalizeRecordForForm } from '../utils/date';
import '../assets/styles/record.css';

const route = useRoute();
const store = useRecordsStore();
const { records, loading } = storeToRefs(store);
const { showToast } = useToast();

const tabs = [
  { key: 'sleep', label: '睡眠', icon: 'fa-moon' },
  { key: 'steps', label: '步数', icon: 'fa-shoe-prints' },
  { key: 'water', label: '饮水', icon: 'fa-droplet' },
  { key: 'exercise', label: '运动', icon: 'fa-person-running' },
  { key: 'diet', label: '饮食', icon: 'fa-utensils' },
  { key: 'stress', label: '压力', icon: 'fa-face-tired' },
  { key: 'cycle', label: '生理周期', icon: 'fa-calendar-days' },
];

const validTab = (t) => tabs.some(tab => tab.key === t);
const activeTab = ref(validTab(route.query.tab) ? route.query.tab : 'sleep');

watch(() => route.query.tab, (tab) => {
  if (validTab(tab)) {
    activeTab.value = tab;
    fetchData();
  }
});
const editingRecord = ref(null);
const filterDate = ref('');

const formMap = { sleep: SleepForm, steps: StepsForm, water: WaterForm, exercise: ExerciseForm, diet: DietForm, stress: StressForm, cycle: CycleForm };
const currentForm = computed(() => formMap[activeTab.value]);

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
const showDateColumn = computed(() => activeTab.value !== 'cycle');

function displayRecordDate(record) {
  return formatDisplayDate(record.record_date);
}

function formatCell(record, header) {
  if (header.includes('时长')) {
    if (record.duration_min != null) return record.duration_min + 'min';
    if (record.duration_h != null) return record.duration_h + 'h';
  }
  if (header.includes('步数')) return record.steps?.toLocaleString();
  if (header.includes('饮水')) return record.amount_ml + 'ml';
  if (header.includes('运动类型')) return record.exercise_type;
  if (header.includes('热量')) return record.calories_kcal + 'kcal';
  if (header.includes('入睡时间')) return record.sleep_time;
  if (header.includes('质量')) return { good: '好', fair: '一般', poor: '差' }[record.quality] || record.quality;
  if (header.includes('食物')) return record.food_name;
  if (header.includes('摄入时间')) return record.meal_time;
  if (header.includes('压力等级')) return { low: '低', medium: '中', high: '高' }[record.level] || record.level;
  if (header.includes('评分')) return record.score;
  if (header.includes('开始日期')) return formatDisplayDate(record.start_date);
  if (header.includes('结束日期')) return formatDisplayDate(record.end_date);
  if (header.includes('周期天数')) return record.cycle_length || '-';
  return '-';
}

function closeEditModal() {
  editingRecord.value = null;
}

function editRecord(record) {
  editingRecord.value = normalizeRecordForForm(record);
}

async function fetchData() {
  const params = {};
  if (filterDate.value) params.date = filterDate.value;
  try {
    await store.fetchRecords(activeTab.value, params);
  } catch (err) {
    showToast(err.response?.data?.error?.message || err.message || '加载失败', 'error');
  }
}

async function refreshList(message) {
  filterDate.value = '';
  try {
    await store.fetchRecords(activeTab.value, {});
    if (message) showToast(message, 'success');
  } catch (err) {
    showToast(err.response?.data?.error?.message || err.message || '列表刷新失败', 'error');
  }
}

async function onCreated() {
  await refreshList('记录已保存');
}

async function onEditSaved() {
  closeEditModal();
  await refreshList('记录已更新');
}

async function deleteRec(id) {
  if (!confirm('确定删除这条记录？')) return;
  try {
    await store.deleteRecord(activeTab.value, id);
    if (String(editingRecord.value?.id) === String(id)) closeEditModal();
    store.removeRecordLocally(id);
    showToast('已删除', 'info');
    try {
      await fetchData();
    } catch (_) {
      /* 本地列表已更新，后台同步失败可忽略 */
    }
  } catch (err) {
    showToast(err.response?.data?.error?.message || err.message || '删除失败', 'error');
  }
}

onMounted(fetchData);
</script>
