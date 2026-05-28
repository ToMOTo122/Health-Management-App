<template>
  <AppLayout>
    <div class="page-header">
      <h1>个人中心</h1>
      <p>管理你的个人资料和健康目标</p>
    </div>

    <!-- Profile -->
    <div class="card mb-4">
      <div class="card-header" style="display: flex; align-items: center; justify-content: space-between;">
        <h3>个人资料</h3>
        <div class="avatar-placeholder" :style="{ backgroundColor: avatarColor }">
          {{ avatarInitial }}
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label>昵称 <span class="required">*</span></label>
          <input class="form-input" v-model="profile.nickname" @blur="validateNickname" />
          <span v-if="errors.nickname" class="error-text">{{ errors.nickname }}</span>
        </div>
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
        <div class="form-group">
          <label>年龄</label>
          <input class="form-input" type="number" v-model.number="profile.age" @blur="validateAge" />
          <span v-if="errors.age" class="error-text">{{ errors.age }}</span>
        </div>
        <div class="form-group">
          <label>身高 (cm)</label>
          <input class="form-input" type="number" step="0.1" v-model="profile.height_cm" @blur="validateHeight" />
          <span v-if="errors.height" class="error-text">{{ errors.height }}</span>
        </div>
        <div class="form-group">
          <label>体重 (kg)</label>
          <input class="form-input" type="number" step="0.1" v-model="profile.weight_kg" @blur="validateWeight" />
          <span v-if="errors.weight" class="error-text">{{ errors.weight }}</span>
        </div>
        <div class="form-group">
          <label>注册时间</label>
          <input class="form-input" :value="formattedCreatedAt" disabled />
        </div>
      </div>
      <button class="btn btn-primary mt-3" style="width:auto" @click="saveProfile" :disabled="profileSaving">
        {{ profileSaving ? '保存中...' : '保存资料' }}
      </button>
    </div>

    <!-- AI Model Settings -->
    <div class="card mb-4">
      <div class="card-header"><h3>AI 模型设置</h3></div>
      <div class="form-group">
        <label>DeepSeek API Key</label>
        <div style="display:flex; gap:8px;">
          <input
            class="form-input"
            :type="showApiKey ? 'text' : 'password'"
            v-model="deepseekApiKey"
            placeholder="输入你的 DeepSeek API Key"
            style="flex:1"
          />
          <button class="btn btn-outline" style="width:auto; white-space:nowrap;" @click="showApiKey = !showApiKey">
            {{ showApiKey ? '隐藏' : '显示' }}
          </button>
        </div>
        <p v-if="hasKey" style="font-size:12px; color:var(--teal); margin-top:4px;">
          <i class="fa-solid fa-circle-check"></i> 已配置 API Key
        </p>
        <p style="font-size:12px; color:var(--text-secondary); margin-top:4px;">
          在 <a href="https://platform.deepseek.com/api_keys" target="_blank" style="color:var(--primary);">platform.deepseek.com</a> 获取你的 API Key
        </p>
      </div>
      <button class="btn btn-primary mt-3" style="width:auto" @click="saveApiKey">保存 API Key</button>
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
      <button class="btn btn-primary mt-3" style="width:auto" @click="saveGoals" :disabled="goalsSaving">
        {{ goalsSaving ? '保存中...' : '保存目标' }}
      </button>
    </div>

    <!-- Password -->
    <div class="card mb-4">
      <div class="card-header"><h3>修改密码</h3></div>
      <div class="form-group"><label>原密码</label><input class="form-input" type="password" v-model="pwForm.oldPassword" /></div>
      <div class="form-group"><label>新密码</label><input class="form-input" type="password" v-model="pwForm.newPassword" @input="validatePassword" /></div>
      <div class="form-group"><label>确认新密码</label><input class="form-input" type="password" v-model="pwForm.confirmPassword" @input="validatePassword" /></div>
      <span v-if="errors.password" class="error-text">{{ errors.password }}</span>
      <button class="btn btn-primary mt-3" style="width:auto" @click="changePw" :disabled="pwSaving">
        {{ pwSaving ? '修改中...' : '修改密码' }}
      </button>
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
        <button class="quick-btn" @click="showTimePicker('water')"><i class="fa-solid fa-droplet"></i> 添加饮水提醒</button>
        <button class="quick-btn" @click="showTimePicker('sleep')"><i class="fa-solid fa-moon"></i> 添加睡眠提醒</button>
        <button class="quick-btn" @click="showTimePicker('exercise')"><i class="fa-solid fa-fire"></i> 添加运动提醒</button>
        <button class="quick-btn" @click="showTimePicker('record')"><i class="fa-solid fa-clipboard"></i> 添加记录提醒</button>
      </div>
    </div>

    <!-- Logout -->
    <button class="btn btn-danger mt-4" style="width:auto" @click="confirmLogout">退出登录</button>

  </AppLayout>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
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

// Reactive data
const profile = reactive({ nickname: '', gender: '', age: null, height_cm: null, weight_kg: null, email: '', created_at: null });
const goals = reactive({ sleep_hours: 8, steps_daily: 10000, water_ml: 2000, exercise_min: 30, calories_kcal: 2000 });
const pwForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' });
const pwMsg = ref('');
const pwOk = ref(false);
const reminders = ref([]);
const showApiKey = ref(false);
const deepseekApiKey = ref('');
const hasKey = ref(false);

// UI states
const profileSaving = ref(false);
const goalsSaving = ref(false);
const pwSaving = ref(false);
const errors = reactive({ nickname: '', age: '', height: '', weight: '', password: '' });

// Helper: validate nickname
const validateNickname = () => {
  const val = profile.nickname?.trim();
  if (!val) errors.nickname = '昵称不能为空';
  else if (val.length < 1 || val.length > 50) errors.nickname = '昵称长度 1-50 个字符';
  else if (/[<>\"\'\\\/]/.test(val)) errors.nickname = '昵称不能包含特殊字符';
  else errors.nickname = '';
};

const validateAge = () => {
  const age = profile.age;
  if (age !== null && age !== '' && (isNaN(age) || age < 0 || age > 120)) {
    errors.age = '年龄须为 0-120 之间的整数';
  } else errors.age = '';
};

const validateHeight = () => {
  const h = profile.height_cm;
  if (h !== null && h !== '' && (isNaN(h) || h < 50 || h > 250)) {
    errors.height = '身高范围 50-250 cm';
  } else errors.height = '';
};

const validateWeight = () => {
  const w = profile.weight_kg;
  if (w !== null && w !== '' && (isNaN(w) || w < 10 || w > 300)) {
    errors.weight = '体重范围 10-300 kg';
  } else errors.weight = '';
};

const validatePassword = () => {
  const { newPassword, confirmPassword } = pwForm;
  if (newPassword && newPassword.length < 6) {
    errors.password = '新密码至少 6 位';
  } else if (newPassword !== confirmPassword) {
    errors.password = '两次输入的新密码不一致';
  } else {
    errors.password = '';
  }
};

// Avatar helpers (纯前端，不存储)
const avatarInitial = computed(() => {
  const nick = profile.nickname?.trim() || 'U';
  return nick.charAt(0).toUpperCase();
});
const avatarColor = computed(() => {
  const colors = ['#FFADAD', '#FFD6A5', '#FDFFB6', '#CAFFBF', '#9BF6FF', '#A0C4FF', '#BDB2FF', '#FFC6FF'];
  let hash = 0;
  for (let i = 0; i < profile.nickname?.length; i++) {
    hash = profile.nickname.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
});

const formattedCreatedAt = computed(() => {
  if (!profile.created_at) return '未知';
  return new Date(profile.created_at).toLocaleString();
});

const typeLabel = (t) => ({ water: '💧 饮水', sleep: '💤 睡眠', exercise: '🏃 运动', record: '📋 记录' }[t] || t);

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

async function loadData() {
  try {
    const [pRes, gRes, rRes, sRes] = await Promise.all([
      usersAPI.getProfile(), usersAPI.getGoals(), remindersAPI.list(), usersAPI.getSettings(),
    ]);
    if (pRes.data.success) {
      Object.assign(profile, pRes.data.data);
      // 确保 age, height_cm, weight_kg 为 null 而非空字符串
      profile.age = profile.age ?? null;
      profile.height_cm = profile.height_cm ?? null;
      profile.weight_kg = profile.weight_kg ?? null;
    }
    if (gRes.data.success) Object.assign(goals, gRes.data.data);
    if (rRes.data.success) reminders.value = rRes.data.data;
    if (sRes.data.success) hasKey.value = sRes.data.data.has_deepseek_key;
  } catch (_) {}
}

async function saveProfile() {
  validateNickname();
  validateAge();
  validateHeight();
  validateWeight();
  if (errors.nickname || errors.age || errors.height || errors.weight) {
    showToast('请修正表单中的错误', 'error');
    return;
  }

  profileSaving.value = true;
  try {
    // 将空字符串转为 null
    const payload = {
      nickname: profile.nickname?.trim(),
      gender: profile.gender || null,
      age: profile.age === '' ? null : profile.age,
      height_cm: profile.height_cm === '' ? null : profile.height_cm,
      weight_kg: profile.weight_kg === '' ? null : profile.weight_kg,
    };
    const { data } = await usersAPI.updateProfile(payload);
    if (data.success) {
      showToast('资料已保存', 'success');
      // 同步 store 中的用户信息（例如昵称）
      await auth.fetchProfile();
    }
  } catch (err) {
    showToast(err.response?.data?.error?.message || '保存失败', 'error');
  } finally {
    profileSaving.value = false;
  }
}

async function saveApiKey() {
  try {
    const { data } = await usersAPI.updateSettings({ deepseek_api_key: deepseekApiKey.value });
    if (data.success) {
      hasKey.value = data.data.has_deepseek_key;
      deepseekApiKey.value = '';
      showToast('API Key 已保存', 'success');
    }
  } catch (err) { showToast(err.response?.data?.error?.message || '保存失败', 'error'); }
}

async function saveGoals() {
  goalsSaving.value = true;
  try {
    await goalsStore.updateGoals(goals);
    // 临时 alert 确保用户知道已保存
    alert('目标已保存！');  // ← 添加这行
    showToast('目标已保存', 'success');
  } catch (err) {
    alert('保存失败：' + (err.response?.data?.error?.message || '未知错误'));
    showToast(err.response?.data?.error?.message || '保存失败', 'error');
  } finally {
    goalsSaving.value = false;
  }
}

async function changePw() {
  pwMsg.value = ''; pwOk.value = false;
  if (!pwForm.oldPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
    pwMsg.value = '请完整填写原密码、新密码和确认密码';
    return;
  }
  validatePassword();
  if (errors.password) {
    pwMsg.value = errors.password;
    return;
  }
  pwSaving.value = true;
  try {
    const { data } = await usersAPI.changePassword({
      oldPassword: pwForm.oldPassword,
      newPassword: pwForm.newPassword
    });
    if (data.success) {
      pwMsg.value = data.message;
      pwOk.value = true;
      pwForm.oldPassword = '';
      pwForm.newPassword = '';
      pwForm.confirmPassword = '';
      showToast('密码修改成功，下次登录请使用新密码', 'success');
    }
  } catch (err) {
    pwMsg.value = err.response?.data?.error?.message || '修改失败';
  } finally {
    pwSaving.value = false;
  }
}


// 使用 prompt 输入时间（最稳定，恢复原有功能）
async function showTimePicker(type) {
  const time = prompt('请输入提醒时间 (HH:MM，例如 09:00 或 21:30):', '09:00');
  if (!time) return; // 用户取消

  // 正则校验格式
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(time)) {
    alert('时间格式错误！请使用 HH:MM 格式（小时00-23，分钟00-59）');
    return;
  }

  // 可选：提醒时间不能太离谱（例如不能是 25:00）
  const [hours, minutes] = time.split(':').map(Number);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    alert('小时必须在0-23之间，分钟必须在0-59之间');
    return;
  }

  // 调用添加提醒
  await addReminder(type, time);
}

async function addReminder(type, time_of_day) {
  // 标准化用户输入的时间（已经是 HH:MM，但为了安全截取前5位）
  const normalizedInput = time_of_day.substring(0, 5);
  
  // 检查是否已存在相同类型和时间的提醒（比较 HH:MM）
  const exists = reminders.value.some((r) => {
    const existingTime = r.time_of_day.substring(0, 5);
    return r.type === type && existingTime === normalizedInput;
  });
  
  if (exists) {
    alert(`提醒已存在：${typeLabel(type)} 在 ${normalizedInput} 已经添加过了。`);
    return;
  }
  
  try {
    const { data } = await remindersAPI.create({ type, time_of_day });
    if (data.success) {
      await loadData(); // 重新加载提醒列表，确保最新
      alert(`提醒已添加：${typeLabel(type)} 在 ${time_of_day}`);
      showToast('提醒已添加', 'success');
    } else {
      alert('添加失败：' + (data.message || '未知错误'));
    }
  } catch (err) {
    const msg = err.response?.data?.error?.message || '网络错误，请稍后重试';
    alert('添加失败：' + msg);
    showToast(msg, 'error');
  }
}

async function deleteReminder(id) {
  if (!confirm('确定要删除这个提醒吗？')) return;
  try {
    const { data } = await remindersAPI.delete(id);
    if (data.success) {
      await loadData();
      alert('提醒已删除');
      showToast('已删除', 'info');
    }
  } catch (err) {
    alert('删除失败');
  }
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

function confirmLogout() {
  if (confirm('确定要退出登录吗？')) {
    handleLogout();
  }
}

async function handleLogout() {
  await auth.logout();
  router.push('/login');
}

onMounted(loadData);
</script>

<style scoped>
.required { color: var(--danger); font-size: 12px; margin-left: 4px; }
.error-text { font-size: 12px; color: var(--danger); margin-top: 4px; display: block; }
.avatar-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  color: white;
  text-shadow: 0 1px 1px rgba(0,0,0,0.2);
}
</style>