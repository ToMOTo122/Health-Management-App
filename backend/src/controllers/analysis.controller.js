const analysisService = require('../services/analysis.service');
const { success, error } = require('../utils/helpers');

const analysisController = {
  async today(req, res) {
    try {
      const stats = await analysisService.getTodayStats(req.user.id);
      return success(res, stats);
    } catch (err) {
      throw err;
    }
  },

  async summary(req, res) {
    try {
      const { period = 'week' } = req.query;
      if (!['week', 'month', '3month'].includes(period)) {
        return error(res, 'VALIDATION_ERROR', 'period 参数必须是 week、month 或 3month', 400);
      }
      const summary = await analysisService.getSummary(req.user.id, period);
      return success(res, summary);
    } catch (err) {
      throw err;
    }
  },

  async trend(req, res) {
    try {
      const { type } = req.params;
      const { period = 'week' } = req.query;
      const validTypes = ['sleep', 'steps', 'water', 'exercise', 'diet', 'calories'];
      if (!validTypes.includes(type)) {
        return error(res, 'VALIDATION_ERROR', `type 参数必须是 ${validTypes.join(', ')} 之一`, 400);
      }
      if (!['week', 'month', '3month'].includes(period)) {
        return error(res, 'VALIDATION_ERROR', 'period 参数必须是 week、month 或 3month', 400);
      }
      const trend = await analysisService.getTrend(req.user.id, type, period);
      return success(res, trend);
    } catch (err) {
      throw err;
    }
  },

  async goalStatus(req, res) {
    try {
      const status = await analysisService.getGoalStatus(req.user.id);
      return success(res, status);
    } catch (err) {
      throw err;
    }
  },

  async weeklyReport(req, res) {
    try {
      const report = await analysisService.getWeeklyReport(req.user.id);
      return success(res, report);
    } catch (err) {
      throw err;
    }
  },
};

module.exports = analysisController;
