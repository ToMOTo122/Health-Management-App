import { defineStore } from 'pinia';
import { ref } from 'vue';
import { chatAPI } from '../api/chat.api';

export const useChatStore = defineStore('chat', () => {
  const messages = ref([
    {
      role: 'assistant',
      content: '你好！我是你的AI健康助手<br>你可以问我关于健康数据的问题，例如：<br>• "我这周平均睡眠多久？"<br>• "我的饮水达标了吗？"<br>• "给我一些健康建议"<br><br>请记住，我提供的只是一般性健康建议，不能替代专业医生诊断。',
    },
  ]);
  const loading = ref(false);

  async function sendMessage(text) {
    messages.value.push({ role: 'user', content: text });
    loading.value = true;
    try {
      const { data } = await chatAPI.sendMessage(text);
      if (data.success) {
        messages.value.push({
          role: 'assistant',
          content: data.data.reply,
          offline: data.data.offline,
        });
      }
    } catch (_) {
      messages.value.push({
        role: 'assistant',
        content: '抱歉，AI 服务暂时不可用。请稍后再试。',
      });
    } finally {
      loading.value = false;
    }
  }

  async function fetchHistory() {
    const { data } = await chatAPI.getHistory(50);
    if (data.success && data.data.length > 0) {
      messages.value = data.data;
    }
  }

  return { messages, loading, sendMessage, fetchHistory };
});
