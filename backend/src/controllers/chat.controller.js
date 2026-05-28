const chatService = require('../services/chat.service');
const { success, error } = require('../utils/helpers');

const chatController = {
  // ========== Conversation management ==========

  async listConversations(req, res) {
    try {
      const conversations = await chatService.listConversations(req.user.id);
      return success(res, conversations);
    } catch (err) {
      throw err;
    }
  },

  async createConversation(req, res) {
    try {
      const { title } = req.body;
      const conversation = await chatService.createConversation(req.user.id, title);
      return success(res, conversation, '对话创建成功', 201);
    } catch (err) {
      throw err;
    }
  },

  async updateConversation(req, res) {
    try {
      const { id } = req.params;
      const { title } = req.body;
      if (!title || !title.trim()) {
        return error(res, 'VALIDATION_ERROR', '标题不能为空', 400);
      }
      await chatService.renameConversation(parseInt(id), req.user.id, title.trim());
      return success(res, null, '重命名成功');
    } catch (err) {
      throw err;
    }
  },

  async deleteConversation(req, res) {
    try {
      const { id } = req.params;
      await chatService.deleteConversation(parseInt(id), req.user.id);
      return success(res, null, '对话已删除');
    } catch (err) {
      throw err;
    }
  },

  // ========== Messaging ==========

  async sendMessage(req, res) {
    try {
      const { message, conversationId, model } = req.body;
      const selectedModel = model || 'ollama';
      if (!['ollama', 'deepseek'].includes(selectedModel)) {
        return error(res, 'VALIDATION_ERROR', '不支持的模型类型', 400);
      }
      if (!message || !message.trim()) {
        return error(res, 'VALIDATION_ERROR', '请输入消息内容', 400);
      }
      if (!conversationId) {
        return error(res, 'VALIDATION_ERROR', '请指定对话', 400);
      }

      const result = await chatService.sendMessage(
        req.user.id, parseInt(conversationId), message.trim(), selectedModel
      );
      const disclaimer = '⚕️ 提示：本系统仅提供一般健康管理建议，不能替代专业医生诊断。如有身体不适，请及时就医。';

      return success(res, {
        reply: result.reply,
        disclaimer,
        offline: result.ollamaError || false,
        model: selectedModel,
      });
    } catch (err) {
      throw err;
    }
  },

  async getHistory(req, res) {
    try {
      const { conversationId, limit = 50 } = req.query;
      if (!conversationId) {
        return error(res, 'VALIDATION_ERROR', '请指定对话', 400);
      }
      const history = await chatService.getHistory(
        req.user.id, parseInt(conversationId), limit
      );
      return success(res, history);
    } catch (err) {
      throw err;
    }
  },
};

module.exports = chatController;
