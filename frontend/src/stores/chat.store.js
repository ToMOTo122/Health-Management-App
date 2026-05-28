import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { chatAPI } from '../api/chat.api';

function defaultGreeting() {
  return {
    role: 'assistant',
    content: '你好！我是你的AI健康助手<br>你可以问我关于健康数据的问题，例如：<br>• "我这周平均睡眠多久？"<br>• "我的饮水达标了吗？"<br>• "给我一些健康建议"<br><br>请记住，我提供的只是一般性健康建议，不能替代专业医生诊断。',
  };
}

export const useChatStore = defineStore('chat', () => {
  const conversations = ref([]);
  const currentConversationId = ref(null);
  const messages = ref([defaultGreeting()]);
  const loading = ref(false);
  const selectedModel = ref('ollama');

  const currentConversation = computed(() =>
    conversations.value.find((c) => c.id === currentConversationId.value)
  );

  const hasConversations = computed(() => conversations.value.length > 0);

  // ========== Conversation CRUD ==========

  async function fetchConversations() {
    const { data } = await chatAPI.getConversations();
    if (data.success) {
      conversations.value = data.data;
    }
  }

  async function createConversation(title) {
    const { data } = await chatAPI.createConversation(title || '新对话');
    if (data.success) {
      conversations.value.unshift(data.data);
      return data.data;
    }
    return null;
  }

  async function renameConversation(id, title) {
    await chatAPI.renameConversation(id, title);
    const conv = conversations.value.find((c) => c.id === id);
    if (conv) conv.title = title;
  }

  async function deleteConversation(id) {
    await chatAPI.deleteConversation(id);
    conversations.value = conversations.value.filter((c) => c.id !== id);
    if (currentConversationId.value === id) {
      if (conversations.value.length > 0) {
        await selectConversation(conversations.value[0].id);
      } else {
        currentConversationId.value = null;
        messages.value = [defaultGreeting()];
      }
    }
  }

  // ========== Conversation Selection ==========

  async function selectConversation(id) {
    currentConversationId.value = id;
    localStorage.setItem('lastConversationId', String(id));
    messages.value = [defaultGreeting()];
    try {
      await fetchHistory(id);
    } catch (_) {}
  }

  watch(selectedModel, (val) => {
    localStorage.setItem('selectedChatModel', val);
  });

  async function startNewConversation() {
    const conv = await createConversation();
    if (conv) {
      await selectConversation(conv.id);
    }
  }

  // ========== Messaging ==========

  async function sendMessage(text) {
    if (!currentConversationId.value) {
      const conv = await createConversation();
      if (!conv) return;
      currentConversationId.value = conv.id;
      localStorage.setItem('lastConversationId', String(conv.id));
    }

    messages.value.push({ role: 'user', content: text });
    loading.value = true;
    try {
      const { data } = await chatAPI.sendMessage(text, currentConversationId.value, selectedModel.value);
      if (data.success) {
        messages.value.push({
          role: 'assistant',
          content: data.data.reply,
          offline: data.data.offline,
          model: data.data.model || selectedModel.value,
        });
        await fetchConversations();
      }
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || '抱歉，AI 服务暂时不可用。请稍后再试。';
      messages.value.push({
        role: 'assistant',
        content: errMsg,
      });
    } finally {
      loading.value = false;
    }
  }

  async function fetchHistory(conversationId) {
    const id = conversationId || currentConversationId.value;
    if (!id) return;
    const { data } = await chatAPI.getHistory(id, 50);
    if (data.success && data.data.length > 0) {
      messages.value = data.data;
    }
  }

  // ========== Initialization ==========

  async function init() {
    await fetchConversations();
    const savedModel = localStorage.getItem('selectedChatModel');
    if (savedModel && ['ollama', 'deepseek'].includes(savedModel)) {
      selectedModel.value = savedModel;
    }
    const lastId = localStorage.getItem('lastConversationId');
    if (lastId && conversations.value.find((c) => c.id === Number(lastId))) {
      await selectConversation(Number(lastId));
    } else if (conversations.value.length > 0) {
      await selectConversation(conversations.value[0].id);
    }
  }

  return {
    conversations,
    currentConversationId,
    currentConversation,
    messages,
    loading,
    hasConversations,
    fetchConversations,
    createConversation,
    renameConversation,
    deleteConversation,
    selectConversation,
    startNewConversation,
    sendMessage,
    fetchHistory,
    init,
    selectedModel,
  };
});
