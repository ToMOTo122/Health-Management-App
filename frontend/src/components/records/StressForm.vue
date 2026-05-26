<template>
  <div class="record-form">
    <h3 class="record-form__title">
      <span class="record-form__title-icon"><i class="fa-solid fa-face-tired"></i></span>
      {{ editing ? '编辑压力记录' : '记录压力' }}
    </h3>
    <div class="record-form__body grid-2">
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
const { save } = useRecordSubmit('stress', emit);

const form = reactive({ record_date: localDateString(), level: 'low', score: 3 });

onMounted(() => { if (props.editing) Object.assign(form, normalizeRecordForForm(props.editing)); });

async function submit() {
  await save(form, props.editing);
}
</script>
