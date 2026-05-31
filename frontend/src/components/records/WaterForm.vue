<template>
  <div class="record-form">
    <h3 class="record-form__title">
      <span class="record-form__title-icon"><i class="fa-solid fa-droplet"></i></span>
      {{ editing ? '编辑饮水记录' : '记录饮水' }}
    </h3>
    <div class="record-form__body grid-2">
      <div class="form-group"><label>日期</label><input class="form-input" type="date" v-model="form.record_date" :max="today" /></div>
      <div class="form-group"><label>饮水量 (ml)</label><input class="form-input" type="number" v-model="form.amount_ml" min="0" step="50" /></div>
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
const { save } = useRecordSubmit('water', emit);

const today = localDateString();
const form = reactive({ record_date: today, amount_ml: 500 });

onMounted(() => { if (props.editing) Object.assign(form, normalizeRecordForForm(props.editing)); });

async function submit() {
  await save(form, props.editing);
}
</script>
