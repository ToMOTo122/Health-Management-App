<template>
  <div class="record-form">
    <h3 class="record-form__title">
      <span class="record-form__title-icon"><i class="fa-solid fa-utensils"></i></span>
      {{ editing ? '编辑饮食记录' : '记录饮食' }}
    </h3>
    <div class="record-form__body grid-2">
      <div class="form-group"><label>日期</label><input class="form-input" type="date" v-model="form.record_date" :max="today" /></div>
      <div class="form-group"><label>食物名称</label><input class="form-input" v-model="form.food_name" placeholder="如米饭、鸡胸肉" /></div>
      <div class="form-group"><label>摄入时间</label><input class="form-input" type="time" v-model="form.meal_time" /></div>
      <div class="form-group"><label>热量 (kcal)</label><input class="form-input" type="number" v-model="form.calories_kcal" min="0" /></div>
    </div>
    <div class="record-form__actions">
      <button type="button" class="btn btn-primary" @click="submit"><i class="fa-solid fa-check"></i> 保存</button>
      <button v-if="editing" type="button" class="btn btn-secondary" @click="$emit('cancel')">取消</button>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue';
import { useRecordSubmit } from '../../composables/useRecordSubmit';
import { localDateString, normalizeRecordForForm } from '../../utils/date';

const props = defineProps({ editing: Object });
const emit = defineEmits(['saved', 'cancel']);
const { save } = useRecordSubmit('diet', emit);

const today = localDateString();
const form = reactive({ record_date: today, food_name: '', meal_time: '12:00', calories_kcal: 0 });

onMounted(() => { if (props.editing) Object.assign(form, normalizeRecordForForm(props.editing)); });

async function submit() {
  await save(form, props.editing);
}
</script>
