const { makeRecordService } = require('../services/record.service');
const { success, error } = require('../utils/helpers');
const { prepareSleepRecord } = require('../utils/sleep');
const { prepareCycleRecord } = require('../utils/cycle');

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

const DATE_FIELD_MAP = {
  cycle: 'start_date',
};

function sanitizeBody(body) {
  const data = { ...body };
  delete data.id;
  delete data.user_id;
  delete data.created_at;
  delete data.updated_at;
  return data;
}

async function prepareRecordBody(type, req, excludeId = null) {
  const raw = sanitizeBody(req.body);
  if (type === 'sleep') return prepareSleepRecord(req.user.id, raw, excludeId);
  if (type === 'cycle') return prepareCycleRecord(req.user.id, raw, excludeId);
  return raw;
}

// 检查日期字段不能是未来日期
function validateNotFuture(data) {
  const today = new Date().toISOString().split('T')[0];
  const dateFields = ['record_date', 'start_date', 'end_date'];
  for (const field of dateFields) {
    if (data[field] && data[field] > today) {
      throw Object.assign(new Error('日期不能设置为未来日期'), { code: 'FUTURE_DATE', status: 400 });
    }
  }
}

// Create a controller factory for a given record type
function makeRecordController(type) {
  const tableName = TABLE_MAP[type];
  const dateField = DATE_FIELD_MAP[type] || 'record_date';
  const service = makeRecordService(tableName, dateField);

  return {
    async create(req, res) {
      try {
        validateNotFuture(req.body);

        // 步数记录：每天只能有一条
        if (type === 'steps') {
          const existing = await service.query(req.user.id, { date: req.body.record_date, limit: 1 });
          if (existing.length > 0) {
            return error(res, 'DUPLICATE_STEPS', '当天已存在步数记录，每天只能记录一条', 409);
          }
        }

        const body = await prepareRecordBody(type, req);
        const record = await service.create(req.user.id, body);
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
        validateNotFuture(req.body);

        const body = await prepareRecordBody(type, req, req.params.id);
        const record = await service.update(req.user.id, req.params.id, body);
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

module.exports = { makeRecordController, VALID_TYPES };
