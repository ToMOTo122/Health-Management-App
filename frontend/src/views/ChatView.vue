<template>
  <AppLayout>
    <div class="page-header">
      <h1>AI 健康助手</h1>
    </div>

    <div class="card" style="padding: 0; overflow: hidden;">
      <div class="chat-page-layout">
        <!-- Left: conversation sidebar -->
        <ConversationSidebar
          :conversations="chat.conversations"
          :currentId="chat.currentConversationId"
          :collapsed="sidebarCollapsed"
          @select="chat.selectConversation"
          @new="chat.startNewConversation()"
          @rename="(id, title) => chat.renameConversation(id, title)"
          @delete="chat.deleteConversation"
          @toggle="sidebarCollapsed = !sidebarCollapsed"
        />

        <!-- Right: chat area -->
        <div class="chat-area">
          <Transition name="fade">
            <div v-if="sidebarCollapsed" class="collapsed-actions">
              <button class="ca-btn" title="展开对话列表" @click="sidebarCollapsed = false">
                <i class="fa-solid fa-bars"></i>
              </button>
              <button class="ca-btn" title="新对话" @click="chat.startNewConversation()">
                <i class="fa-solid fa-plus"></i>
              </button>
            </div>
          </Transition>
          <div class="chat-messages" ref="msgContainer">
            <div v-for="(msg, i) in chat.messages" :key="i" :class="['chat-msg', msg.role]">
              <div class="chat-avatar">
                <i v-if="msg.role === 'assistant'" class="fa-solid fa-robot"></i>
                <i v-else class="fa-solid fa-user"></i>
              </div>
              <div class="chat-bubble" v-html="renderMarkdown(msg.content)"></div>
              <span v-if="msg.role === 'assistant' && msg.model" class="model-badge">{{ msg.model === 'deepseek' ? 'DeepSeek' : '本地 AI' }}</span>
            </div>
          </div>

          <div class="model-selector">
            <select v-model="chat.selectedModel">
              <option value="ollama">本地 AI (qwen3.5:9b)</option>
              <option value="deepseek">DeepSeek (deepseek-v4-flash)</option>
            </select>
          </div>

          <div class="chat-input-area">
            <input
              v-model="inputText"
              placeholder="输入你的健康问题..."
              @keyup.enter="sendMsg"
              :disabled="chat.loading"
            />
            <button
              class="btn btn-primary"
              style="width:auto"
              @click="sendMsg"
              :disabled="chat.loading || !inputText.trim()"
            >
              <i class="fa-solid" :class="chat.loading ? 'fa-spinner' : 'fa-paper-plane'"></i>
            </button>
          </div>

          <div class="quick-questions">
            <button
              v-for="q in quickQs"
              :key="q"
              class="quick-q"
              @click="inputText = q; sendMsg()"
            >{{ q }}</button>
          </div>
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
import ConversationSidebar from '../components/chat/ConversationSidebar.vue';
import { useChatStore } from '../stores/chat.store';
import { renderMarkdown } from '../utils/markdown';

const chat = useChatStore();
const inputText = ref('');
const msgContainer = ref(null);
const sidebarCollapsed = ref(false);

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
  try { await chat.init(); } catch (_) {}
});
</script>

<style scoped>
.chat-page-layout {
  display: flex;
  height: calc(100vh - 180px);
  min-height: 400px;
}
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px 20px;
}
.collapsed-actions {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
  background: var(--card-bg);
  border-radius: 10px;
  padding: 4px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  align-self: flex-start;
}
.ca-btn {
  width: 36px;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 16px;
  color: var(--text-secondary);
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
}
.ca-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-light);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.model-selector {
  display: flex;
  align-items: center;
  padding: 6px 0;
}
.model-selector select {
  font-size: 13px;
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--card-bg);
  color: var(--text-primary);
  cursor: pointer;
  outline: none;
}
.model-selector select:focus {
  border-color: var(--primary);
}

.model-badge {
  font-size: 10px;
  color: var(--text-secondary);
  background: var(--bg-light, #f1f5f9);
  padding: 1px 6px;
  border-radius: 4px;
  margin-top: 2px;
  align-self: flex-start;
}

/* Markdown styles inside chat bubbles */
.chat-bubble :deep(code) {
  background: rgba(0,0,0,0.06);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
}
.chat-bubble :deep(pre) {
  background: #1e293b;
  color: #e2e8f0;
  padding: 12px 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 8px 0;
}
.chat-bubble :deep(pre code) {
  background: none;
  padding: 0;
  color: inherit;
}
.chat-bubble :deep(ul), .chat-bubble :deep(ol) {
  padding-left: 20px;
  margin: 4px 0;
}
.chat-bubble :deep(li) {
  margin: 2px 0;
}
.chat-bubble :deep(blockquote) {
  border-left: 3px solid var(--primary);
  padding-left: 12px;
  margin: 8px 0;
  color: var(--text-secondary);
}
.chat-bubble :deep(table) {
  border-collapse: collapse;
  margin: 8px 0;
}
.chat-bubble :deep(th), .chat-bubble :deep(td) {
  border: 1px solid var(--border);
  padding: 4px 8px;
  text-align: left;
}
.chat-bubble :deep(th) {
  background: var(--bg-light, #f1f5f9);
}
.chat-bubble :deep(p) {
  margin: 4px 0;
}
.chat-bubble :deep(p:first-child) {
  margin-top: 0;
}
.chat-bubble :deep(p:last-child) {
  margin-bottom: 0;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 8px;
}
</style>
