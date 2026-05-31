<template>
  <div class="record-form">
    <h3 class="record-form__title">
      <span class="record-form__title-icon"><i class="fa-solid fa-calendar-days"></i></span>
      {{ editing ? '编辑周期记录' : '记录生理周期' }}
    </h3>
    <div class="record-form__body grid-2">
      <div class="form-group">
        <label>开始日期</label>
        <input class="form-input" type="date" v-model="form.start_date" required :max="today" @change="onDateChange" />
      </div>
      <div class="form-group">
        <label>结束日期</label>
        <input class="form-input" type="date" v-model="form.end_date" required :max="today" @change="onDateChange" />
        <p v-if="dateHint" class="form-hint form-hint--warn">{{ dateHint }}</p>
        <p v-else-if="overlapHint" class="form-hint form-hint--warn">{{ overlapHint }}</p>
      </div>
      <div class="form-group"><label>周期长度 (天)</label><input class="form-input" type="number" v-model="form.cycle_length" min="1" /></div>
      <div class="form-group"><label>备注</label><textarea class="form-input" v-model="form.notes" rows="2" placeholder="选填"></textarea></div>
    </div>
    <div class="record-form__actions">
      <button type="button" class="btn btn-primary" @click="submit"><i class="fa-solid fa-check"></i> 保存</button>
      <button v-if="editing" type="button" class="btn btn-secondary" @click="$emit('cancel')">取消</button>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useRecordSubmit } from '../../composables/useRecordSubmit';
import { useToast } from '../../composables/useToast';
import { useRecordsStore } from '../../stores/records.store';
import { localDateString, normalizeRecordForForm } from '../../utils/date';
import {
  assertCycleDateOrder,
  buildCyclePayload,
  hasOverlappingCycle,
  OVERLAPPING_CYCLE_MSG,
} from '../../utils/cycle';

const props = defineProps({ editing: Object });
const emit = defineEmits(['saved', 'cancel']);
const { save } = useRecordSubmit('cycle', emit);
const { showToast } = useToast();
const store = useRecordsStore();
const { records } = storeToRefs(store);

const today = localDateString();
const form = reactive({ start_date: localDateString(), end_date: localDateString(), cycle_length: 28, notes: '' });

const dateHint = computed(() => assertCycleDateOrder(form.start_date, form.end_date));

const overlapHint = computed(() => {
  if (dateHint.value || !form.start_date || !form.end_date) return null;
  const built = buildCyclePayload(form);
  if (built.error) return null;
  if (hasOverlappingCycle(records.value, built.payload, props.editing?.id)) {
    return OVERLAPPING_CYCLE_MSG;
  }
  return null;
});

function onDateChange() {
  if (!form.end_date && form.start_date) {
    form.end_date = form.start_date;
  }
}

onMounted(() => {
  if (props.editing) {
    Object.assign(form, normalizeRecordForForm(props.editing));
  }
});

async function submit() {
  if (!form.start_date || !form.end_date) {
    showToast('请填写开始日期和结束日期', 'error');
    return;
  }
  const built = buildCyclePayload(form);
  if (built.error) {
    showToast(built.error, 'error');
    return;
  }
  try {
    await store.fetchRecords('cycle', {});
  } catch (_) {
    /* 列表刷新失败时仍依赖后端校验 */
  }
  if (hasOverlappingCycle(records.value, built.payload, props.editing?.id)) {
    showToast(OVERLAPPING_CYCLE_MSG, 'error');
    return;
  }
  await save(built.payload, props.editing);
}
</script>
