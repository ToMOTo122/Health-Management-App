const userService = require('../services/user.service');
const { success, error } = require('../utils/helpers');

const usersController = {
  async getProfile(req, res) {
    try {
      const profile = await userService.getProfile(req.user.id);
      return success(res, profile);
    } catch (err) {
      if (err.code) return error(res, err.code, err.message, err.status || 400);
      throw err;
    }
  },

  async updateProfile(req, res) {
    try {
      const profile = await userService.updateProfile(req.user.id, req.body);
      return success(res, profile, '个人资料已更新');
    } catch (err) {
      if (err.code) return error(res, err.code, err.message, err.status || 400);
      throw err;
    }
  },

  async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return error(res, 'VALIDATION_ERROR', '请输入原密码和新密码', 400);
      }
      if (newPassword.length < 6) {
        return error(res, 'VALIDATION_ERROR', '新密码至少 6 位', 400);
      }
      await userService.changePassword(req.user.id, oldPassword, newPassword);
      return success(res, null, '密码已修改');
    } catch (err) {
      if (err.code) return error(res, err.code, err.message, err.status || 400);
      throw err;
    }
  },

  async getSettings(req, res) {
    try {
      const profile = await userService.getProfile(req.user.id);
      return success(res, { has_deepseek_key: profile.has_deepseek_key });
    } catch (err) {
      if (err.code) return error(res, err.code, err.message, err.status || 400);
      throw err;
    }
  },

  async updateSettings(req, res) {
    try {
      const { deepseek_api_key } = req.body;
      await userService.updateProfile(req.user.id, { deepseek_api_key: deepseek_api_key || null });
      return success(res, { has_deepseek_key: !!deepseek_api_key }, 'API Key 已保存');
    } catch (err) {
      if (err.code) return error(res, err.code, err.message, err.status || 400);
      throw err;
    }
  },

  async getGoals(req, res) {
    try {
      const goals = await userService.getGoals(req.user.id);
      return success(res, goals);
    } catch (err) {
      if (err.code) return error(res, err.code, err.message, err.status || 400);
      throw err;
    }
  },

  async updateGoals(req, res) {
    try {
      const goals = await userService.updateGoals(req.user.id, req.body);
      return success(res, goals, '健康目标已更新');
    } catch (err) {
      if (err.code) return error(res, err.code, err.message, err.status || 400);
      throw err;
    }
  },
};

module.exports = usersController;
