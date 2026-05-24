<template>
  <div>
    <h3 style="margin-bottom:16px">{{ editing ? '编辑压力记录' : '记录压力' }}</h3>
    <div class="grid-2">
      <div class="form-group"><label>日期</label><input class="form-input" type="date" v-model="form.record_date" /></div>
      <div class="form-group">
        <label>压力等级</label>
        <select class="form-input" v-model="form.level">
          <option value="low">低</option>
          <option value="medium">中</option>
          <option value="high">高</option>
        </select>
      </div>
      <div class="form-group"><label>压力评分 (1-10)</label><input class="form-input" type="number" min="1" max="10" v-model="form.score" /></div>
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

const form = reactive({ record_date: new Date().toISOString().split('T')[0], level: 'low', score: 3 });

onMounted(() => { if (props.editing) Object.assign(form, props.editing); });

async function submit() {
  try {
    if (props.editing) await store.updateRecord('stress', props.editing.id, { ...form });
    else await store.createRecord('stress', { ...form });
    emit('saved');
  } catch (_) {}
}
</script>
