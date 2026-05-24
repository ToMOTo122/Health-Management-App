const authService = require('../services/auth.service');
const { success, error } = require('../utils/helpers');

const authController = {
  async register(req, res) {
    try {
      const result = await authService.register(req.body);
      return success(res, result, '注册成功', 201);
    } catch (err) {
      if (err.code) return error(res, err.code, err.message, err.status || 400);
      throw err;
    }
  },

  async login(req, res) {
    try {
      const result = await authService.login(req.body);
      return success(res, result, '登录成功');
    } catch (err) {
      if (err.code) return error(res, err.code, err.message, err.status || 400);
      throw err;
    }
  },

  async refresh(req, res) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return error(res, 'MISSING_TOKEN', '缺少刷新令牌', 400);
      }
      const result = await authService.refresh(refreshToken);
      return success(res, result);
    } catch (err) {
      if (err.code) return error(res, err.code, err.message, err.status || 400);
      throw err;
    }
  },

  async me(req, res) {
    try {
      const result = await authService.getProfile(req.user.id);
      return success(res, result);
    } catch (err) {
      if (err.code) return error(res, err.code, err.message, err.status || 400);
      throw err;
    }
  },

  async logout(req, res) {
    try {
      const userId = req.user.id;
      const jti = req.user.jti;
      await authService.logout(jti, userId);
      return success(res, null, '已退出登录');
    } catch (err) {
      if (err.code) return error(res, err.code, err.message, err.status || 400);
      throw err;
    }
  },
};

module.exports = authController;
