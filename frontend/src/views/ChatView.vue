<template>
  <AppLayout>
    <div class="page-header">
      <h1>AI 健康助手</h1>
      <p>向 AI 咨询健康问题</p>
    </div>

    <div class="card">
      <div class="chat-container">
        <div class="chat-messages" ref="msgContainer">
          <div v-for="(msg, i) in chat.messages" :key="i" :class="['chat-msg', msg.role]">
            <div class="chat-avatar">
              <i v-if="msg.role === 'assistant'" class="fa-solid fa-robot"></i>
              <i v-else class="fa-solid fa-user"></i>
            </div>
            <div class="chat-bubble" v-html="msg.content.replace(/\n/g, '<br>')"></div>
          </div>
        </div>

        <div class="chat-input-area">
          <input v-model="inputText" placeholder="输入你的健康问题..." @keyup.enter="sendMsg" />
          <button class="btn btn-primary" style="width:auto" @click="sendMsg" :disabled="chat.loading">
            <i class="fa-solid" :class="chat.loading ? 'fa-spinner' : 'fa-paper-plane'"></i>
          </button>
        </div>

        <div class="quick-questions">
          <button v-for="q in quickQs" :key="q" class="quick-q" @click="inputText = q; sendMsg()">{{ q }}</button>
        </div>
      </div>

      <div class="disclaimer">
        <i class="fa-solid fa-circle-info"></i>
        本系统仅提供一般健康管理建议，不能替代专业医生诊断。如有身体不适，请及时就医。
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import AppLayout from '../components/layout/AppLayout.vue';
import { useChatStore } from '../stores/chat.store';

const chat = useChatStore();
const inputText = ref('');
const msgContainer = ref(null);

const quickQs = [
  '我这周平均睡眠多久？',
  '最近饮水是否达标？',
  '给我一些健康建议',
  '如何改善睡眠质量？',
  '推荐一些简单的运动',
];

async function sendMsg() {
  const text = inputText.value.trim();
  if (!text || chat.loading) return;
  inputText.value = '';
  await chat.sendMessage(text);
  await nextTick();
  if (msgContainer.value) {
    msgContainer.value.scrollTop = msgContainer.value.scrollHeight;
  }
}

onMounted(async () => {
  try { await chat.fetchHistory(); } catch (_) {}
});
</script>
