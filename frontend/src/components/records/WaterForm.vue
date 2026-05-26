<template>
  <div>
    <h3 style="margin-bottom:16px">{{ editing ? '编辑饮水记录' : '记录饮水' }}</h3>
    <div class="grid-2">
      <div class="form-group"><label>日期</label><input class="form-input" type="date" v-model="form.record_date" /></div>
      <div class="form-group"><label>饮水量 (ml)</label><input class="form-input" type="number" v-model="form.amount_ml" /></div>
    </div>
    <div style="display:flex; gap:10px; margin-top:16px">
      <button class="btn btn-primary" style="width:auto" @click="submit">保存</button>
      <button v-if="editing" class="btn btn-secondary" style="width:auto" @click="$emit('cancel')">取消</button>
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

const form = reactive({ record_date: localDateString(), amount_ml: 500 });

onMounted(() => { if (props.editing) Object.assign(form, normalizeRecordForForm(props.editing)); });

async function submit() {
  await save(form, props.editing);
}
</script>
