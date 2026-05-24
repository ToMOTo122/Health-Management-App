const chatService = require('../services/chat.service');
const { success, error } = require('../utils/helpers');

const chatController = {
  async sendMessage(req, res) {
    try {
      const { message } = req.body;
      if (!message || !message.trim()) {
        return error(res, 'VALIDATION_ERROR', '请输入消息内容', 400);
      }

      const result = await chatService.sendMessage(req.user.id, message.trim());
      const disclaimer = '⚕️ 提示：本系统仅提供一般健康管理建议，不能替代专业医生诊断。如有身体不适，请及时就医。';

      return success(res, {
        reply: result.reply,
        disclaimer,
        offline: result.ollamaError || false,
      });
    } catch (err) {
      throw err;
    }
  },

  async getHistory(req, res) {
    try {
      const { limit = 50 } = req.query;
      const history = await chatService.getHistory(req.user.id, limit);
      return success(res, history);
    } catch (err) {
      throw err;
    }
  },
};

module.exports = chatController;
