const { makeRecordService } = require('../services/record.service');
const redis = require('../config/redis');
const { success, error } = require('../utils/helpers');

// Table mapping for each record type
const TABLE_MAP = {
  sleep: 'sleep_records',
  steps: 'steps_records',
  water: 'water_records',
  exercise: 'exercise_records',
  diet: 'diet_records',
  stress: 'stress_records',
  cycle: 'cycle_records',
};

const VALID_TYPES = Object.keys(TABLE_MAP);

// Create a controller factory for a given record type
function makeRecordController(type) {
  const tableName = TABLE_MAP[type];
  const service = makeRecordService(tableName);

  return {
    async create(req, res) {
      try {
        const record = await service.create(req.user.id, req.body);
        await checkGoalAchievement(req.user.id, type, req.body);
        return success(res, record, '记录成功', 201);
      } catch (err) {
        if (err.code) return error(res, err.code, err.message, err.status || 400);
        throw err;
      }
    },

    async query(req, res) {
      try {
        const { date, from, to, limit, offset } = req.query;
        const records = await service.query(req.user.id, { date, from, to, limit, offset });
        return success(res, records);
      } catch (err) {
        if (err.code) return error(res, err.code, err.message, err.status || 400);
        throw err;
      }
    },

    async getById(req, res) {
      try {
        const record = await service.getById(req.user.id, req.params.id);
        return success(res, record);
      } catch (err) {
        if (err.code) return error(res, err.code, err.message, err.status || 400);
        throw err;
      }
    },

    async update(req, res) {
      try {
        const record = await service.update(req.user.id, req.params.id, req.body);
        return success(res, record, '已更新');
      } catch (err) {
        if (err.code) return error(res, err.code, err.message, err.status || 400);
        throw err;
      }
    },

    async delete(req, res) {
      try {
        await service.delete(req.user.id, req.params.id);
        return success(res, null, '已删除');
      } catch (err) {
        if (err.code) return error(res, err.code, err.message, err.status || 400);
        throw err;
      }
    },
  };
}

// Check if a record causes a goal to be met, and mark it in Redis
async function checkGoalAchievement(userId, type, data) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const key = `goal_met:${userId}:${today}`;

    let goalType = null;
    let value = 0;
    let target = 0;

    if (type === 'sleep' && data.duration_h) {
      goalType = 'sleep';
      value = data.duration_h;
      // Get goal from DB
    } else if (type === 'steps' && data.steps) {
      goalType = 'steps';
      value = data.steps;
    } else if (type === 'water' && data.amount_ml) {
      goalType = 'water';
      value = data.amount_ml;
    } else if (type === 'exercise' && data.duration_min) {
      goalType = 'exercise';
      value = data.duration_min;
    }

    if (goalType) {
      // Mark in Redis that this goal type was met today (simplified — real check in analysis service)
      const met = await redis.get(key);
      const metList = met ? JSON.parse(met) : [];
      if (!metList.includes(goalType)) {
        metList.push(goalType);
        await redis.set(key, JSON.stringify(metList), 'EX', 86400);
      }
    }
  } catch (_) {
    // Non-critical, ignore
  }
}

module.exports = { makeRecordController, VALID_TYPES };
