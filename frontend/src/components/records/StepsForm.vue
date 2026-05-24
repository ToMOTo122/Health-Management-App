<template>
  <div>
    <h3 style="margin-bottom:16px">{{ editing ? '编辑步数记录' : '记录步数' }}</h3>
    <div class="grid-2">
      <div class="form-group"><label>日期</label><input class="form-input" type="date" v-model="form.record_date" /></div>
      <div class="form-group"><label>步数</label><input class="form-input" type="number" v-model="form.steps" /></div>
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

const form = reactive({ record_date: new Date().toISOString().split('T')[0], steps: 8000 });

onMounted(() => { if (props.editing) Object.assign(form, props.editing); });

async function submit() {
  try {
    if (props.editing) await store.updateRecord('steps', props.editing.id, { ...form });
    else await store.createRecord('steps', { ...form });
    emit('saved');
  } catch (_) {}
}
</script>
