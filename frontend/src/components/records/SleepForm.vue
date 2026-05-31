<template>
  <div class="record-form">
    <h3 class="record-form__title">
      <span class="record-form__title-icon"><i class="fa-solid fa-moon"></i></span>
      {{ editing ? '编辑睡眠记录' : '记录睡眠' }}
    </h3>
    <div class="record-form__body grid-2">
      <div class="form-group">
        <label>日期</label>
        <input class="form-input" type="date" v-model="form.record_date" required :max="today" @change="onTimeChange" />
      </div>
      <div class="form-group">
        <label>入睡时间</label>
        <input class="form-input" type="time" v-model="form.sleep_time" required @input="onTimeChange" />
      </div>
      <div class="form-group">
        <label>起床时间</label>
        <input class="form-input" type="time" v-model="form.wake_time" required @input="onTimeChange" />
      </div>
      <div class="form-group">
        <label>睡眠时长</label>
        <div class="form-input record-form__readonly" aria-readonly="true">
          {{ durationLabel }}
        </div>
        <p v-if="timeHint" class="form-hint form-hint--warn">{{ timeHint }}</p>
        <p v-else-if="overlapHint" class="form-hint form-hint--warn">{{ overlapHint }}</p>
      </div>
      <div class="form-group">
        <label>睡眠质量</label>
        <select class="form-input" v-model="form.quality">
          <option value="good">好</option>
          <option value="fair">一般</option>
          <option value="poor">差</option>
        </select>
      </div>
    </div>
    <div class="record-form__actions">
      <button type="button" class="btn btn-primary" @click="submit">
        <i class="fa-solid fa-check"></i> 保存
      </button>
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
  assertSleepWakeOrder,
  buildSleepPayload,
  calcSleepDurationHours,
  hasOverlappingSleep,
  OVERLAPPING_SLEEP_MSG,
} from '../../utils/sleep';

const props = defineProps({ editing: Object });
const emit = defineEmits(['saved', 'cancel']);
const { save } = useRecordSubmit('sleep', emit);
const { showToast } = useToast();
const store = useRecordsStore();
const { records } = storeToRefs(store);

const today = localDateString();
const form = reactive({
  record_date: today,
  sleep_time: '23:00',
  wake_time: '07:00',
  quality: 'good',
});

const timeHint = computed(() => assertSleepWakeOrder(form.sleep_time, form.wake_time));

const overlapHint = computed(() => {
  if (timeHint.value || !form.record_date || !form.sleep_time || !form.wake_time) return null;
  const built = buildSleepPayload(form);
  if (built.error) return null;
  if (hasOverlappingSleep(records.value, built.payload, props.editing?.id)) {
    return OVERLAPPING_SLEEP_MSG;
  }
  return null;
});

const durationLabel = computed(() => {
  if (timeHint.value) return '—';
  const result = calcSleepDurationHours(form.sleep_time, form.wake_time);
  if (result.error) return '—';
  return `${result.duration_h} 小时（自动计算）`;
});

function onTimeChange() {
  const result = calcSleepDurationHours(form.sleep_time, form.wake_time);
  if (!result.error) {
    form.duration_h = result.duration_h;
  }
}

onMounted(() => {
  if (props.editing) {
    Object.assign(form, normalizeRecordForForm(props.editing));
    onTimeChange();
  } else {
    onTimeChange();
  }
});

async function submit() {
  if (!form.record_date || !form.sleep_time || !form.wake_time) {
    showToast('请填写日期、入睡时间和起床时间', 'error');
    return;
  }
  const built = buildSleepPayload(form);
  if (built.error) {
    showToast(built.error, 'error');
    return;
  }
  try {
    await store.fetchRecords('sleep', {});
  } catch (_) {
    /* 列表刷新失败时仍依赖后端校验 */
  }
  if (hasOverlappingSleep(records.value, built.payload, props.editing?.id)) {
    showToast(OVERLAPPING_SLEEP_MSG, 'error');
    return;
  }
  await save(built.payload, props.editing);
}
</script>
