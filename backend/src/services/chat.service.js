const pool = require('../config/db');
const redis = require('../config/redis');
const ollamaConfig = require('../config/ollama');
const deepseekConfig = require('../config/deepseek');
const analysisService = require('./analysis.service');

const SYSTEM_PROMPT = `你是"健康小助手"（Health Assistant），一个专业、友好的健康管理 AI 助手。

你的能力：
1. 用中文回答健康相关问题。
2. 分析用户的个人健康数据，提供个性化见解。
3. 根据用户的健康数据，提供一般性的健康管理建议。
4. 根据用户记录，提醒健康习惯。

你必须遵守的重要规则：
- 绝不提供医疗诊断、开药或疾病治疗方案。
- 对于听起来像疾病描述的问题（"我头疼""胸口痛"等），你必须先声明"我无法提供医疗诊断"，再给一般性建议。
- 在所有健康建议末尾附上免责声明："⚕️ 提示：本系统仅提供一般健康管理建议，不能替代专业医生诊断。如有身体不适，请及时就医。"
- 保持积极和鼓励的态度。
- 回答简洁（300字以内，除非用户要求详细说明）。
- 适度使用 emoji 增强可读性，但不过度。
- 引用用户健康数据时，使用上下文中提供的准确数字。
- 如果用户问的问题没有相关数据，坦率说明而不是猜测。

你不是医生，你是提供生活方式建议的健康教练。`;

const FALLBACK_RESPONSES = [
  {
    keywords: ['睡眠', '睡', '失眠'],
    reply: '根据你的健康数据，建议你保持规律作息，每天固定时间睡觉和起床。睡前避免使用电子设备，可以进行轻度拉伸或阅读来帮助放松。如果长期失眠，建议咨询医生。\n\n⚕️ 提示：本系统仅提供一般健康管理建议，不能替代专业医生诊断。如有身体不适，请及时就医。',
  },
  {
    keywords: ['饮水', '喝水', '水'],
    reply: '保持充足饮水对健康很重要！建议每天少量多次饮用，不要等口渴了再喝。你可以设置饮水提醒，帮助养成好习惯。\n\n⚕️ 提示：本系统仅提供一般健康管理建议，不能替代专业医生诊断。如有身体不适，请及时就医。',
  },
  {
    keywords: ['运动', '锻炼', '健身', '跑步'],
    reply: '每周建议进行至少150分钟中等强度或75分钟高强度有氧运动，配合2次力量训练。选择你喜欢的运动方式更容易坚持！\n\n⚕️ 提示：本系统仅提供一般健康管理建议，不能替代专业医生诊断。如有身体不适，请及时就医。',
  },
  {
    keywords: ['饮食', '吃', '热量', '减肥', '减重'],
    reply: '健康饮食建议：多吃蔬菜水果，选择全谷物，适量摄入蛋白质，减少加工食品和高糖饮料。记录饮食可以帮助你更好地了解自己的饮食习惯。\n\n⚕️ 提示：本系统仅提供一般健康管理建议，不能替代专业医生诊断。如有身体不适，请及时就医。',
  },
  {
    keywords: ['压力', '焦虑', '放松', '紧张'],
    reply: '压力管理建议：尝试深呼吸练习、正念冥想、规律运动或与朋友交流。记录压力水平有助于你识别压力来源。如果长期感到焦虑，建议寻求专业心理帮助。\n\n⚕️ 提示：本系统仅提供一般健康管理建议，不能替代专业医生诊断。如有身体不适，请及时就医。',
  },
  {
    keywords: ['步数', '走路', '步行'],
    reply: '每天8000-10000步是一个很好的目标！可以利用碎片时间多走走，比如饭后散步、走楼梯代替电梯。保持活跃对心血管健康非常有益。\n\n⚕️ 提示：本系统仅提供一般健康管理建议，不能替代专业医生诊断。如有身体不适，请及时就医。',
  },
];

const chatService = {
  // ========== Conversation management ==========

  async listConversations(userId) {
    const [rows] = await pool.query(
      `SELECT c.id, c.title, c.created_at, c.updated_at,
              (SELECT content FROM chat_history
               WHERE conversation_id = c.id AND role = 'user'
               ORDER BY created_at DESC LIMIT 1) AS last_message
       FROM conversations c
       WHERE c.user_id = ?
       ORDER BY c.updated_at DESC`,
      [userId]
    );
    return rows;
  },

  async createConversation(userId, title) {
    const [result] = await pool.query(
      'INSERT INTO conversations (user_id, title) VALUES (?, ?)',
      [userId, title || '新对话']
    );
    const [rows] = await pool.query(
      'SELECT id, title, created_at, updated_at FROM conversations WHERE id = ?',
      [result.insertId]
    );
    return rows[0];
  },

  async renameConversation(conversationId, userId, title) {
    const [result] = await pool.query(
      'UPDATE conversations SET title = ? WHERE id = ? AND user_id = ?',
      [title, conversationId, userId]
    );
    if (result.affectedRows === 0) {
      const err = new Error('对话不存在');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }
  },

  async deleteConversation(conversationId, userId) {
    const [result] = await pool.query(
      'DELETE FROM conversations WHERE id = ? AND user_id = ?',
      [conversationId, userId]
    );
    if (result.affectedRows === 0) {
      const err = new Error('对话不存在');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }
    await redis.del(`chat_ctx:${conversationId}`);
  },

  // ========== Messaging ==========

  async sendMessage(userId, conversationId, userMessage, model = 'ollama') {
    const [convs] = await pool.query(
      'SELECT id, title FROM conversations WHERE id = ? AND user_id = ?',
      [conversationId, userId]
    );
    if (convs.length === 0) {
      const err = new Error('对话不存在');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    // Auto-title from first user message
    if (convs[0].title === '新对话') {
      const autoTitle = userMessage.replace(/\n/g, ' ').substring(0, 30);
      await pool.query(
        'UPDATE conversations SET title = ? WHERE id = ?',
        [autoTitle, conversationId]
      );
    }

    // Get conversation history from Redis
    const ctxKey = `chat_ctx:${conversationId}`;
    const ctxData = await redis.get(ctxKey);
    const history = ctxData ? JSON.parse(ctxData) : [];

    // Get user health context
    const healthContext = await this._buildHealthContext(userId);

    // Build messages array for Ollama
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    for (const msg of history.slice(-8)) {
      messages.push({ role: msg.role, content: msg.content });
    }

    messages.push({
      role: 'user',
      content: `${healthContext}\n\n[用户问题]\n${userMessage}`,
    });

    // Save user message to DB and history
    await this._saveMessage(userId, conversationId, 'user', userMessage);
    history.push({ role: 'user', content: userMessage });

    let reply;
    let ollamaError = false;

    if (model === 'deepseek') {
      const [userRows] = await pool.query(
        'SELECT deepseek_api_key FROM users WHERE id = ?', [userId]
      );
      const apiKey = userRows[0]?.deepseek_api_key;
      if (!apiKey) {
        const err = new Error('请先在个人中心配置 DeepSeek API Key');
        err.status = 400;
        err.code = 'DEEPSEEK_KEY_MISSING';
        throw err;
      }
      try {
        reply = await this._callDeepSeek(messages, apiKey);
      } catch (err) {
        console.error('DeepSeek API call failed:', err.message);
        const apiErr = new Error('DeepSeek API 调用失败: ' + err.message);
        apiErr.status = 502;
        apiErr.code = 'DEEPSEEK_API_ERROR';
        throw apiErr;
      }
    } else {
      try {
        reply = await this._callOllama(messages);
      } catch (err) {
        console.error('Ollama call failed, using fallback:', err.message);
        ollamaError = true;
        reply = this._fallbackResponse(userMessage);
      }
    }

    // Save assistant reply
    await this._saveMessage(userId, conversationId, 'assistant', reply);
    history.push({ role: 'assistant', content: reply });

    // Keep last 20 messages in Redis cache
    const trimmed = history.slice(-20);
    await redis.set(ctxKey, JSON.stringify(trimmed), 'EX', 1800);

    return { reply, ollamaError };
  },

  async getHistory(userId, conversationId, limit = 50) {
    const [rows] = await pool.query(
      'SELECT role, content, created_at FROM chat_history WHERE user_id = ? AND conversation_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, conversationId, parseInt(limit)]
    );
    return rows.reverse();
  },

  async _buildHealthContext(userId) {
    try {
      const [profile] = await pool.query(
        'SELECT nickname FROM users WHERE id = ?', [userId]
      );
      const summary = await analysisService.getSummary(userId, 'week');
      const today = await analysisService.getTodayStats(userId);

      return `[当前用户健康数据]
- 昵称: ${profile[0]?.nickname || '用户'}
- 本周日均睡眠: ${summary.avg_sleep}h
- 本周日均步数: ${summary.avg_steps}
- 本周日均饮水: ${summary.avg_water}ml
- 本周运动总时长: ${summary.total_exercise_min}分钟
- 饮水达标天数: ${summary.water_goal_days}/${summary.water_total_days}天
- 今日睡眠: ${today.sleep_h}h, 步数: ${today.steps}, 饮水: ${today.water_ml}ml, 运动: ${today.exercise_min}min`;
    } catch (_) {
      return '[当前用户健康数据暂时无法获取]';
    }
  },

  async _callOllama(messages) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ollamaConfig.timeout);

    try {
      const response = await fetch(`${ollamaConfig.baseURL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ollamaConfig.model,
          messages,
          stream: false,
          options: {
            temperature: 0.5,
            top_p: 0.9,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Ollama returned ${response.status}`);
      }

      const data = await response.json();
      return data.message?.content || this._fallbackResponse('');
    } finally {
      clearTimeout(timeout);
    }
  },

  async _callDeepSeek(messages, apiKey) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), deepseekConfig.timeout);
    console.log('[DeepSeek] Calling API, model:', deepseekConfig.model, 'messages count:', messages.length);

    try {
      const response = await fetch(`${deepseekConfig.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: deepseekConfig.model,
          messages,
          stream: false,
          temperature: 0.5,
          top_p: 0.9,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        let errorMsg = `DeepSeek ${response.status}`;
        try {
          const errorJson = JSON.parse(errorBody);
          errorMsg = errorJson.error?.message || errorMsg;
        } catch (_) {}
        console.error('[DeepSeek] API error:', errorMsg);
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      console.log('[DeepSeek] Response received, length:', content.length);
      console.log('[DeepSeek] First 100 chars:', content.substring(0, 100));
      return content;
    } catch (err) {
      console.error('[DeepSeek] Request failed:', err.message);
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  },

  _fallbackResponse(message) {
    const lower = (message || '').toLowerCase();
    for (const { keywords, reply } of FALLBACK_RESPONSES) {
      if (keywords.some((kw) => lower.includes(kw))) {
        return reply;
      }
    }
    return '我目前无法连接到 AI 服务，请检查 Ollama 是否正在运行。你可以尝试的问题包括：睡眠、饮水、运动、饮食、压力管理和步数相关建议。\n\n⚕️ 提示：本系统仅提供一般健康管理建议，不能替代专业医生诊断。如有身体不适，请及时就医。';
  },

  async _saveMessage(userId, conversationId, role, content) {
    await pool.query(
      'INSERT INTO chat_history (user_id, conversation_id, role, content) VALUES (?, ?, ?, ?)',
      [userId, conversationId, role, content]
    );
  },
};

module.exports = chatService;
