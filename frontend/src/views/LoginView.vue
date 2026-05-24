<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-logo">
        <div class="icon">💙</div>
        <h1>健康小助手</h1>
        <p>一站式健康管理平台</p>
      </div>

      <div v-if="!isRegister">
        <div class="form-group">
          <label>邮箱</label>
          <input class="form-input" v-model="form.email" type="email" placeholder="请输入邮箱" />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input class="form-input" v-model="form.password" type="password" placeholder="请输入密码" @keyup.enter="handleLogin" />
        </div>
        <button class="btn btn-primary" @click="handleLogin" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
        <p class="text-center mt-3 text-muted">
          还没有账户？<span class="text-link" @click="isRegister = true; errMsg = ''">立即注册</span>
        </p>
        <p v-if="errMsg" class="text-center mt-3" style="color:var(--danger);font-size:13px">{{ errMsg }}</p>
      </div>

      <div v-else>
        <div class="form-group">
          <label>昵称</label>
          <input class="form-input" v-model="registerForm.nickname" placeholder="请输入昵称" />
        </div>
        <div class="form-group">
          <label>邮箱</label>
          <input class="form-input" v-model="registerForm.email" type="email" placeholder="请输入邮箱" />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input class="form-input" v-model="registerForm.password" type="password" placeholder="至少6位密码" />
        </div>
        <div class="form-group">
          <label>确认密码</label>
          <input class="form-input" v-model="registerForm.confirmPassword" type="password" placeholder="再次输入密码" @keyup.enter="handleRegister" />
        </div>
        <button class="btn btn-primary" @click="handleRegister" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
        <p class="text-center mt-3 text-muted">
          已有账户？<span class="text-link" @click="isRegister = false; errMsg = ''">返回登录</span>
        </p>
        <p v-if="errMsg" class="text-center mt-3" style="color:var(--danger);font-size:13px">{{ errMsg }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';

const router = useRouter();
const auth = useAuthStore();

const isRegister = ref(false);
const loading = ref(false);
const errMsg = ref('');
const form = reactive({ email: 'demo@health.com', password: '123456' });
const registerForm = reactive({ nickname: '', email: '', password: '', confirmPassword: '' });

async function handleLogin() {
  errMsg.value = '';
  if (!form.email || !form.password) { errMsg.value = '请填写邮箱和密码'; return; }
  loading.value = true;
  try {
    const data = await auth.login(form.email, form.password);
    if (data.success) router.push('/');
    else errMsg.value = data.error?.message || '登录失败';
  } catch (err) {
    errMsg.value = err.response?.data?.error?.message || '网络错误，请稍后再试';
  } finally {
    loading.value = false;
  }
}

async function handleRegister() {
  errMsg.value = '';
  if (!registerForm.nickname || !registerForm.email || !registerForm.password) {
    errMsg.value = '请填写所有必填字段'; return;
  }
  if (registerForm.password !== registerForm.confirmPassword) {
    errMsg.value = '两次密码不一致'; return;
  }
  if (registerForm.password.length < 6) {
    errMsg.value = '密码至少6位'; return;
  }
  loading.value = true;
  try {
    const data = await auth.register(registerForm.nickname, registerForm.email, registerForm.password);
    if (data.success) router.push('/');
    else errMsg.value = data.error?.message || '注册失败';
  } catch (err) {
    errMsg.value = err.response?.data?.error?.message || '网络错误，请稍后再试';
  } finally {
    loading.value = false;
  }
}
</script>
