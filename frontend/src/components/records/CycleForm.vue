<template>
  <div>
    <h3 style="margin-bottom:16px">{{ editing ? '编辑周期记录' : '记录生理周期' }}</h3>
    <div class="grid-2">
      <div class="form-group"><label>开始日期</label><input class="form-input" type="date" v-model="form.start_date" /></div>
      <div class="form-group"><label>结束日期</label><input class="form-input" type="date" v-model="form.end_date" /></div>
      <div class="form-group"><label>周期长度 (天)</label><input class="form-input" type="number" v-model="form.cycle_length" /></div>
      <div class="form-group"><label>备注</label><textarea class="form-input" v-model="form.notes" rows="2"></textarea></div>
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
const { save } = useRecordSubmit('cycle', emit);

const form = reactive({ start_date: localDateString(), end_date: '', cycle_length: 28, notes: '' });

onMounted(() => { if (props.editing) Object.assign(form, normalizeRecordForForm(props.editing)); });

async function submit() {
  await save(form, props.editing);
}
</script>
