<template>
  <div>
    <h3 style="margin-bottom:16px">{{ editing ? '编辑饮食记录' : '记录饮食' }}</h3>
    <div class="grid-2">
      <div class="form-group"><label>日期</label><input class="form-input" type="date" v-model="form.record_date" /></div>
      <div class="form-group"><label>食物名称</label><input class="form-input" v-model="form.food_name" placeholder="如米饭、鸡胸肉" /></div>
      <div class="form-group"><label>摄入时间</label><input class="form-input" type="time" v-model="form.meal_time" /></div>
      <div class="form-group"><label>热量 (kcal)</label><input class="form-input" type="number" v-model="form.calories_kcal" /></div>
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

const form = reactive({ record_date: new Date().toISOString().split('T')[0], food_name: '', meal_time: '12:00', calories_kcal: 500 });

onMounted(() => { if (props.editing) Object.assign(form, props.editing); });

async function submit() {
  try {
    if (props.editing) await store.updateRecord('diet', props.editing.id, { ...form });
    else await store.createRecord('diet', { ...form });
    emit('saved');
  } catch (_) {}
}
</script>
