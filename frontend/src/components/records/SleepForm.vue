<template>
  <div>
    <h3 style="margin-bottom:16px">{{ editing ? '编辑睡眠记录' : '记录睡眠' }}</h3>
    <div class="grid-2">
      <div class="form-group"><label>日期</label><input class="form-input" type="date" v-model="form.record_date" /></div>
      <div class="form-group"><label>入睡时间</label><input class="form-input" type="time" v-model="form.sleep_time" /></div>
      <div class="form-group"><label>起床时间</label><input class="form-input" type="time" v-model="form.wake_time" /></div>
      <div class="form-group"><label>睡眠时长 (小时)</label><input class="form-input" type="number" step="0.1" v-model="form.duration_h" /></div>
      <div class="form-group">
        <label>睡眠质量</label>
        <select class="form-input" v-model="form.quality">
          <option value="good">好</option>
          <option value="fair">一般</option>
          <option value="poor">差</option>
        </select>
      </div>
    </div>
    <div style="display:flex; gap:10px; margin-top:16px">
      <button class="btn btn-primary" style="width:auto" @click="submit">保存</button>
      <button v-if="editing" class="btn btn-secondary" style="width:auto" @click="$emit('cancel')">取消</button>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue';
import { useRecordsStore } from '../../stores/records.store';

const props = defineProps({ editing: Object });
const emit = defineEmits(['saved', 'cancel']);
const store = useRecordsStore();

const today = new Date().toISOString().split('T')[0];
const form = reactive({
  record_date: today,
  sleep_time: '23:00',
  wake_time: '07:00',
  duration_h: 8,
  quality: 'good',
});

onMounted(() => {
  if (props.editing) Object.assign(form, props.editing);
});

async function submit() {
  try {
    if (props.editing) {
      await store.updateRecord('sleep', props.editing.id, { ...form });
    } else {
      await store.createRecord('sleep', { ...form });
    }
    emit('saved');
  } catch (_) {}
}
</script>
