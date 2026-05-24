<template>
  <AppLayout>
    <div class="page-header">
      <h1>个人中心</h1>
      <p>管理你的个人资料和健康目标</p>
    </div>

    <!-- Profile -->
    <div class="card mb-4">
      <div class="card-header"><h3>个人资料</h3></div>
      <div class="grid-2">
        <div class="form-group"><label>昵称</label><input class="form-input" v-model="profile.nickname" /></div>
        <div class="form-group"><label>邮箱</label><input class="form-input" :value="profile.email" disabled /></div>
        <div class="form-group">
          <label>性别</label>
          <select class="form-input" v-model="profile.gender">
            <option value="">不选择</option>
            <option value="male">男</option>
            <option value="female">女</option>
            <option value="other">其他</option>
          </select>
        </div>
        <div class="form-group"><label>年龄</label><input class="form-input" type="number" v-model="profile.age" /></div>
        <div class="form-group"><label>身高 (cm)</label><input class="form-input" type="number" step="0.1" v-model="profile.height_cm" /></div>
        <div class="form-group"><label>体重 (kg)</label><input class="form-input" type="number" step="0.1" v-model="profile.weight_kg" /></div>
      </div>
      <button class="btn btn-primary mt-3" style="width:auto" @click="saveProfile">保存资料</button>
    </div>

    <!-- Goals -->
    <div class="card mb-4">
      <div class="card-header"><h3>健康目标</h3></div>
      <div class="grid-2">
        <div class="form-group"><label>每日睡眠目标 (小时)</label><input class="form-input" type="number" step="0.1" v-model.number="goals.sleep_hours" /></div>
        <div class="form-group"><label>每日步数目标</label><input class="form-input" type="number" v-model.number="goals.steps_daily" /></div>
        <div class="form-group"><label>每日饮水目标 (ml)</label><input class="form-input" type="number" v-model.number="goals.water_ml" /></div>
        <div class="form-group"><label>每日运动目标 (分钟)</label><input class="form-input" type="number" v-model.number="goals.exercise_min" /></div>
        <div class="form-group"><label>每日热量目标 (kcal)</label><input class="form-input" type="number" v-model.number="goals.calories_kcal" /></div>
      </div>
      <button class="btn btn-primary mt-3" style="width:auto" @click="saveGoals">保存目标</button>
    </div>

    <!-- Password -->
    <div class="card mb-4">
      <div class="card-header"><h3>修改密码</h3></div>
      <div class="form-group"><label>原密码</label><input class="form-input" type="password" v-model="pwForm.oldPassword" /></div>
      <div class="form-group"><label>新密码</label><input class="form-input" type="password" v-model="pwForm.newPassword" /></div>
      <button class="btn btn-primary mt-3" style="width:auto" @click="changePw">修改密码</button>
      <p v-if="pwMsg" class="mt-3" :style="{ color: pwOk ? 'var(--teal)' : 'var(--danger)', fontSize: '13px' }">{{ pwMsg }}</p>
    </div>

    <!-- Data Export & Reminders -->
    <div class="card mb-4">
      <div class="card-header"><h3>数据管理</h3></div>
      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:16px">
        <button class="btn btn-outline" @click="exportJSON">导出全部数据 (JSON)</button>
        <button class="btn btn-outline" @click="exportCSV('sleep')">导出睡眠 (CSV)</button>
        <button class="btn btn-outline" @click="exportCSV('steps')">导出步数 (CSV)</button>
        <button class="btn btn-outline" @click="exportCSV('water')">导出饮水 (CSV)</button>
        <button class="btn btn-outline" @click="exportCSV('exercise')">导出运动 (CSV)</button>
        <button class="btn btn-outline" @click="exportCSV('diet')">导出饮食 (CSV)</button>
      </div>
      <div class="card-header"><h3>提醒设置</h3></div>
      <div class="grid-2 mb-3" v-if="reminders.length > 0">
        <div v-for="r in reminders" :key="r.id" class="card" style="padding:12px">
          <strong>{{ typeLabel(r.type) }}</strong> — {{ r.time_of_day }}
          <button class="btn btn-sm btn-danger" style="margin-left:8px" @click="deleteReminder(r.id)">删除</button>
        </div>
      </div>
      <div class="quick-actions">
        <button class="quick-btn" @click="addReminder('water')"><i class="fa-solid fa-droplet"></i> 添加饮水提醒</button>
        <button class="quick-btn" @click="addReminder('sleep')"><i class="fa-solid fa-moon"></i> 添加睡眠提醒</button>
        <button class="quick-btn" @click="addReminder('exercise')"><i class="fa-solid fa-fire"></i> 添加运动提醒</button>
        <button class="quick-btn" @click="addReminder('record')"><i class="fa-solid fa-clipboard"></i> 添加记录提醒</button>
      </div>
    </div>

    <!-- Logout -->
    <button class="btn btn-danger mt-4" style="width:auto" @click="handleLogout">退出登录</button>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import { useAuthStore } from '../stores/auth.store';
import { useGoalsStore } from '../stores/goals.store';
import { usersAPI } from '../api/users.api';
import { remindersAPI } from '../api/reminders.api';
import { exportAPI } from '../api/export.api';
import { useToast } from '../composables/useToast';

const router = useRouter();
const auth = useAuthStore();
const goalsStore = useGoalsStore();
const { showToast } = useToast();

const profile = reactive({ nickname: '', gender: '', age: null, height_cm: null, weight_kg: null, email: '' });
const goals = reactive({ sleep_hours: 8, steps_daily: 10000, water_ml: 2000, exercise_min: 30, calories_kcal: 2000 });
const pwForm = reactive({ oldPassword: '', newPassword: '' });
const pwMsg = ref('');
const pwOk = ref(false);
const reminders = ref([]);

const typeLabel = (t) => ({ water: '💧 饮水', sleep: '💤 睡眠', exercise: '🏃 运动', record: '📋 记录' }[t] || t);

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

async function loadData() {
  try {
    const [pRes, gRes, rRes] = await Promise.all([
      usersAPI.getProfile(), usersAPI.getGoals(), remindersAPI.list(),
    ]);
    if (pRes.data.success) Object.assign(profile, pRes.data.data);
    if (gRes.data.success) Object.assign(goals, gRes.data.data);
    if (rRes.data.success) reminders.value = rRes.data.data;
  } catch (_) {}
}

async function saveProfile() {
  try {
    const { data } = await usersAPI.updateProfile({ nickname: profile.nickname, gender: profile.gender, age: profile.age, height_cm: profile.height_cm, weight_kg: profile.weight_kg });
    if (data.success) showToast('资料已保存', 'success');
  } catch (err) { showToast(err.response?.data?.error?.message || '保存失败', 'error'); }
}

async function saveGoals() {
  try {
    await goalsStore.updateGoals(goals);
    showToast('目标已保存', 'success');
  } catch (err) { showToast(err.response?.data?.error?.message || '保存失败', 'error'); }
}

async function changePw() {
  pwMsg.value = ''; pwOk.value = false;
  if (!pwForm.oldPassword || !pwForm.newPassword) { pwMsg.value = '请填写原密码和新密码'; return; }
  try {
    const { data } = await usersAPI.changePassword(pwForm);
    if (data.success) { pwMsg.value = data.message; pwOk.value = true; pwForm.oldPassword = ''; pwForm.newPassword = ''; }
  } catch (err) { pwMsg.value = err.response?.data?.error?.message || '修改失败'; }
}

async function addReminder(type) {
  const time = prompt('请输入提醒时间 (HH:MM):', '09:00');
  if (!time) return;
  try {
    const { data } = await remindersAPI.create({ type, time_of_day: time });
    if (data.success) { await loadData(); showToast('提醒已添加', 'success'); }
  } catch (err) { showToast(err.response?.data?.error?.message || '添加失败', 'error'); }
}

async function deleteReminder(id) {
  try {
    const { data } = await remindersAPI.delete(id);
    if (data.success) { await loadData(); showToast('已删除', 'info'); }
  } catch (err) { showToast(err.response?.data?.error?.message || '删除失败', 'error'); }
}

async function exportJSON() {
  const { data } = await exportAPI.json();
  downloadBlob(data, `health-data-${new Date().toISOString().split('T')[0]}.json`);
  showToast('导出成功', 'success');
}

async function exportCSV(type) {
  const { data } = await exportAPI.csv(type);
  downloadBlob(data, `${type}-data-${new Date().toISOString().split('T')[0]}.csv`);
  showToast('导出成功', 'success');
}

async function handleLogout() {
  await auth.logout();
  router.push('/login');
}

onMounted(loadData);
</script>
