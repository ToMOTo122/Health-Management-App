const reminderService = require('../services/reminder.service');
const { success, error } = require('../utils/helpers');

const remindersController = {
  async list(req, res) {
    try {
      const reminders = await reminderService.list(req.user.id);
      return success(res, reminders);
    } catch (err) {
      throw err;
    }
  },

  async create(req, res) {
    try {
      const { type, time_of_day } = req.body;
      if (!type || !time_of_day) {
        return error(res, 'VALIDATION_ERROR', '请提供提醒类型和时间', 400);
      }
      const reminder = await reminderService.create(req.user.id, { type, time_of_day });
      return success(res, reminder, '提醒已创建', 201);
    } catch (err) {
      if (err.code) return error(res, err.code, err.message, err.status || 400);
      throw err;
    }
  },

  async update(req, res) {
    try {
      const reminder = await reminderService.update(req.user.id, req.params.id, req.body);
      return success(res, reminder, '提醒已更新');
    } catch (err) {
      if (err.code) return error(res, err.code, err.message, err.status || 400);
      throw err;
    }
  },

  async remove(req, res) {
    try {
      await reminderService.delete(req.user.id, req.params.id);
      return success(res, null, '提醒已删除');
    } catch (err) {
      if (err.code) return error(res, err.code, err.message, err.status || 400);
      throw err;
    }
  },

  async due(req, res) {
    try {
      const due = await reminderService.getDue();
      // Filter to current user's reminders
      const userDue = due.filter((r) => r.userId === req.user.id);
      return success(res, userDue);
    } catch (err) {
      throw err;
    }
  },
};

module.exports = remindersController;
